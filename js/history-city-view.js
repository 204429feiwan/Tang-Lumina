/* The final Chang'an scene is independent of the descending DOM history helix. */
(function (global) {
    'use strict';

    const views = new WeakMap();

    global.createHistoryCityView = function (host) {
        if (host && views.has(host)) return views.get(host);

        const THREE = global.THREE;
        let usable = Boolean(host && host.appendChild && THREE && global.createHistoryCity);
        let disposed = false;
        let initialized = false;
        let renderer = null;
        let scene = null;
        let camera = null;
        let city = null;
        let atmosphere = null;
        const cityMaterials = new Map();
        let lastCityOpacity = -1, renderedFrames = 0;
        const finalRadius = Math.hypot(23, 34);
        const finalAzimuth = Math.atan2(23, 34);

        function markUnavailable() {
            usable = false;
            if (host && host.classList) host.classList.add('city-unavailable');
        }

        function releaseResources() {
            if (renderer) renderer.domElement.removeEventListener('webglcontextlost', onContextLost);

            // The local city shares geometries and materials across many batches.
            // Dispose each shared resource once, including instance attributes.
            const geometries = new Set();
            const materials = new Set();
            const textures = new Set();
            for (const root of [scene, atmosphere?.scene].filter(Boolean)) {
                root.traverse(function (object) {
                    if (object.geometry) geometries.add(object.geometry);
                    const objectMaterials = object.material
                        ? (Array.isArray(object.material) ? object.material : [object.material])
                        : [];
                    objectMaterials.forEach(function (material) {
                        materials.add(material);
                        Object.keys(material).forEach(function (key) {
                            if (material[key] && material[key].isTexture) textures.add(material[key]);
                        });
                    });
                    if (object.isInstancedMesh && object.dispose) object.dispose();
                });
            }
            geometries.forEach(function (geometry) { geometry.dispose(); });
            materials.forEach(function (material) { material.dispose(); });
            textures.forEach(function (texture) { texture.dispose(); });

            if (renderer) {
                renderer.dispose();
                renderer.domElement.remove();
            }
            renderer = null;
            scene = null;
            camera = null;
            city = null;
            atmosphere = null;
            cityMaterials.clear();
        }

        function onContextLost(event) {
            event.preventDefault();
            markUnavailable();
            releaseResources();
        }

        function resize() {
            if (!usable || disposed || !renderer) return;
            const width = Math.max(1, host.clientWidth);
            const height = Math.max(1, host.clientHeight);
            renderer.setPixelRatio(Math.min(global.devicePixelRatio || 1, 1.65));
            renderer.setSize(width, height, false);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            if (atmosphere) {atmosphere.camera.aspect=width/height;atmosphere.camera.updateProjectionMatrix();}
        }

        function initialize() {
            if (!usable || disposed || initialized) return;
            initialized = true;
            try {
                renderer = new THREE.WebGLRenderer({
                    alpha: true,
                    antialias: true,
                    powerPreference: 'default'
                });
                renderer.outputColorSpace = THREE.SRGBColorSpace;
                renderer.setClearColor(0xf1e4cc, 0);
                renderer.toneMapping = THREE.ACESFilmicToneMapping;
                renderer.toneMappingExposure = 1.16;
                renderer.autoClear = false;
                renderer.info.autoReset = false;
                renderer.domElement.setAttribute('aria-hidden', 'true');
                renderer.domElement.addEventListener('webglcontextlost', onContextLost);

                scene = new THREE.Scene();
                scene.fog = new THREE.FogExp2(0xf1e4cc, 0.009);
                camera = new THREE.PerspectiveCamera(42, 1, 0.1, 180);
                camera.position.set(23, 24, 34);
                camera.lookAt(0, 0, -1);

                scene.add(new THREE.HemisphereLight(0xffefd3, 0x8d6650, 1.8));
                const sun = new THREE.DirectionalLight(0xffd291, 3.0);
                sun.position.set(-12, 35, 25);
                scene.add(sun);
                const fill = new THREE.DirectionalLight(0xffcfaa, 1.55);
                fill.position.set(15, -8, -20);
                scene.add(fill);
                const cityLight = new THREE.PointLight(0xffdb9a, 70, 70, 2);
                cityLight.position.set(0, 18, 10);
                scene.add(cityLight);

                city = global.createHistoryCity(THREE);
                // The model stays still. A single camera descent carries the arrival.
                city.position.set(0, 0, 0);
                city.scale.setScalar(1);
                scene.add(city);
                const halo = new THREE.Mesh(
                    new THREE.RingGeometry(16.5, 16.54, 128),
                    new THREE.MeshBasicMaterial({
                        color: 0xbca063,
                        side: THREE.DoubleSide,
                        transparent: true,
                        opacity: 0.36
                    })
                );
                halo.rotation.x = -Math.PI / 2;
                halo.position.y = -0.5;
                city.add(halo);
                city.traverse(object=>{
                    const list=object.material?(Array.isArray(object.material)?object.material:[object.material]):[];
                    list.forEach(material=>{if(!cityMaterials.has(material))cityMaterials.set(material,{opacity:material.opacity,transparent:material.transparent,depthWrite:material.depthWrite});});
                });
                atmosphere = global.createHistoryAtmosphere?.(THREE,global.HISTORY_EVENTS?.length||12);
                if (atmosphere) scene.add(atmosphere.lanterns);

                host.appendChild(renderer.domElement);
                host.classList.remove('city-unavailable');
                resize();
            } catch (error) {
                markUnavailable();
                releaseResources();
                console.warn('Chang’an scene unavailable; retaining the illustrated background.', error);
            }
        }

        function positionCityCamera(progress) {
            const normalized = Math.max(0, Math.min(1, Number(progress) || 0));
            const eased = normalized * normalized * (3 - 2 * normalized);
            const remaining = 1 - eased;
            const distance = finalRadius * (1 + 0.14 * remaining);
            const azimuth = finalAzimuth + 0.09 * remaining;
            camera.position.set(
                Math.sin(azimuth) * distance,
                24 + 9 * remaining,
                Math.cos(azimuth) * distance
            );
            camera.lookAt(0, 0, -1);
        }

        function setCityOpacity(opacity) {
            city.visible=opacity>.0001;
            if(opacity===lastCityOpacity)return;
            for(const [material,base] of cityMaterials){
                material.opacity=base.opacity*opacity;
                const transparent=base.transparent||opacity<.999;
                if(material.transparent!==transparent){material.transparent=transparent;material.needsUpdate=true;}
                material.depthWrite=base.depthWrite&&opacity>.98;
            }
            lastCityOpacity=opacity;
        }

        function render(progress) {
            if (!usable || disposed) return;
            initialize();
            if (!renderer || !city) return;
            positionCityCamera(progress);setCityOpacity(1);
            if(atmosphere)atmosphere.lanterns.visible=false;
            try {
                renderer.info.reset();renderer.clear();
                renderer.render(scene, camera);
            } catch (error) {
                markUnavailable();
                releaseResources();
                console.warn('Chang’an rendering paused; retaining the illustrated background.', error);
            }
        }

        function renderEnvironment(index,exit,cityProgress,time) {
            if(!usable||disposed)return;
            initialize();if(!renderer||!city)return;
            try {
                renderer.info.reset();renderer.clear();
                atmosphere?.update(index,time,1-exit,cityProgress);
                if(atmosphere&&exit<.9999)renderer.render(atmosphere.scene,atmosphere.camera);
                if(cityProgress>0){
                    renderer.clearDepth();setCityOpacity(cityProgress);positionCityCamera(cityProgress);
                    renderer.render(scene,camera);
                }
                renderedFrames++;
            }catch(error){
                markUnavailable();releaseResources();
                console.warn('History atmosphere unavailable; keeping the DOM chronology.',error);
            }
        }

        function prepare() {
            // Precompile/upload while the 907 card is held. Repeated preparation
            // must not reset a camera that has already begun its approach.
            if (!initialized && usable && !disposed) render(0);
            return usable && !disposed;
        }

        function dispose() {
            if (disposed) return;
            disposed = true;
            usable = false;
            releaseResources();
            if (host) views.delete(host);
        }

        const view = {
            prepare: prepare,
            render: render,
            renderEnvironment: renderEnvironment,
            resize: resize,
            dispose: dispose,
            get available() { return usable && !disposed; },
            get effectsInfo() {return {pillar:Boolean(atmosphere),particles:atmosphere?.particleCount||0,frames:renderedFrames,drawCalls:renderer?.info.render.calls||0};}
        };
        if (usable) views.set(host, view);
        else markUnavailable();
        return view;
    };
})(window);
