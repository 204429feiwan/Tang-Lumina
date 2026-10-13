/* A compact, illustrative Chang'an model for the history spiral. Three.js r160. */
(function (global) {
    'use strict';

    global.createHistoryCity = function (THREE) {
        const city = new THREE.Group();
        city.name = 'changan-city';
        const batches = new Map();
        const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
        const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1, 6, 1);
        const sphereGeometry = new THREE.SphereGeometry(1, 6, 4);
        const matrix = new THREE.Matrix4();
        const quaternion = new THREE.Quaternion();
        const up = new THREE.Vector3(0, 1, 0);

        function material(color, emissive, intensity, roughness) {
            return new THREE.MeshStandardMaterial({
                color: color,
                emissive: emissive || color,
                emissiveIntensity: intensity || 0.05,
                roughness: roughness === undefined ? 0.72 : roughness,
                metalness: 0.14
            });
        }

        const materials = {
            foundation: material(0x70543f, 0x3e2a1e, 0.12),
            land: material(0xc5af88, 0x73553b, 0.10),
            street: material(0xd8c29b, 0x88613e, 0.13),
            wall: material(0xb9a17d, 0x684a32, 0.08),
            plaster: material(0xf0ddb5, 0x8b6945, 0.10),
            timber: material(0x86392a, 0x5f241c, 0.15),
            jade: material(0x9e5139, 0x642a1e, 0.20),
            palaceRoof: material(0x8f3529, 0x5c211b, 0.18),
            gold: material(0xd1ae64, 0xffcc76, 0.28, 0.36),
            darkGold: material(0x9f864b, 0xbba15c, 0.11),
            glow: material(0xffdf9f, 0xffb64c, 0.85),
            tree: material(0x746b45, 0x474329, 0.06)
        };

        // Four sloping rings make a curved hip roof, including raised eave corners.
        // Its unit footprint is reused for every pavilion, house and palace hall.
        function makeRoofGeometry() {
            const vertices = [];
            const indices = [];
            const outline = [
                [-1, -1], [0, -1], [1, -1], [1, 0],
                [1, 1], [0, 1], [-1, 1], [-1, 0]
            ];
            const rings = [
                [0.5, 0.5, 0.00, 0.17],
                [0.41, 0.40, 0.23, 0.07],
                [0.30, 0.24, 0.57, 0.02],
                [0.27, 0.008, 0.93, 0.00]
            ];
            rings.forEach(function (ring) {
                outline.forEach(function (point, i) {
                    vertices.push(point[0] * ring[0], ring[2] + (i % 2 === 0 ? ring[3] : 0), point[1] * ring[1]);
                });
            });
            for (let row = 0; row < rings.length - 1; row++) {
                for (let i = 0; i < 8; i++) {
                    const a = row * 8 + i;
                    const b = row * 8 + (i + 1) % 8;
                    const c = (row + 1) * 8 + i;
                    const d = (row + 1) * 8 + (i + 1) % 8;
                    indices.push(a, c, b, b, c, d);
                }
            }
            // Close the top so the roof remains solid when seen directly from above.
            indices.push(24, 28, 26, 24, 30, 28);
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            geometry.setIndex(indices);
            geometry.computeVertexNormals();
            return geometry;
        }
        const roofGeometry = makeRoofGeometry();

        function instance(geometry, mat, x, y, z, sx, sy, sz, rotation) {
            const key = geometry.uuid + ':' + mat.uuid;
            if (!batches.has(key)) batches.set(key, { geometry: geometry, material: mat, matrices: [] });
            quaternion.setFromAxisAngle(up, rotation || 0);
            matrix.compose(new THREE.Vector3(x, y, z), quaternion, new THREE.Vector3(sx, sy, sz));
            batches.get(key).matrices.push(matrix.clone());
        }

        function box(mat, x, y, z, w, h, d, rotation) {
            instance(boxGeometry, mat, x, y, z, w, h, d, rotation);
        }

        function line(mat, x1, y1, z1, x2, y2, z2, radius) {
            const start = new THREE.Vector3(x1, y1, z1);
            const end = new THREE.Vector3(x2, y2, z2);
            const direction = end.clone().sub(start);
            const length = direction.length();
            if (length < 0.0001) return;
            const key = cylinderGeometry.uuid + ':' + mat.uuid;
            if (!batches.has(key)) batches.set(key, { geometry: cylinderGeometry, material: mat, matrices: [] });
            quaternion.setFromUnitVectors(up, direction.normalize());
            matrix.compose(start.add(end).multiplyScalar(0.5), quaternion, new THREE.Vector3(radius, length, radius));
            batches.get(key).matrices.push(matrix.clone());
        }

        function roof(x, y, z, w, h, d, grand, rotation) {
            const angle = rotation || 0;
            instance(roofGeometry, grand ? materials.palaceRoof : materials.jade, x, y, z, w, h, d, angle);
            // Gold ridges and eaves remain legible even from a distant orbit camera.
            function ridge(ax, ay, az, bx, by, bz, radius) {
                const c = Math.cos(angle);
                const s = Math.sin(angle);
                line(materials.gold,
                    x + ax * c + az * s, y + ay, z - ax * s + az * c,
                    x + bx * c + bz * s, y + by, z - bx * s + bz * c, radius);
            }
            ridge(-w * 0.29, h * 0.96, 0, w * 0.29, h * 0.96, 0, grand ? 0.027 : 0.014);
            [-1, 1].forEach(function (side) {
                ridge(-w * 0.5, h * 0.17, side * d * 0.5, 0, 0, side * d * 0.5, 0.013);
                ridge(0, 0, side * d * 0.5, w * 0.5, h * 0.17, side * d * 0.5, 0.013);
                if (grand) {
                    [-1, 1].forEach(function (end) {
                        ridge(end * w * 0.27, h * 0.94, 0, end * w * 0.39, h * 0.3, side * d * 0.34, 0.019);
                        ridge(end * w * 0.39, h * 0.3, side * d * 0.34, end * w * 0.5, h * 0.17, side * d * 0.5, 0.019);
                    });
                }
            });
        }

        function hall(x, z, w, d, baseY, bodyHeight, grand, rotation) {
            const angle = rotation || 0;
            const roofHeight = grand ? Math.min(0.75, w * 0.21) : 0.28;
            box(materials.wall, x, baseY + 0.10, z, w + 0.16, 0.20, d + 0.14, angle);
            box(materials.plaster, x, baseY + 0.23 + bodyHeight / 2, z, w * 0.88, bodyHeight, d * 0.82, angle);
            box(materials.timber, x, baseY + 0.20 + bodyHeight, z, w * 0.98, 0.10, d * 0.98, angle);
            roof(x, baseY + 0.27 + bodyHeight, z, w * 1.2, roofHeight, d * 1.3, grand, angle);
            const count = grand ? 7 : 3;
            for (let i = 0; i < count; i++) {
                const localX = -w * 0.42 + i * w * 0.84 / (count - 1);
                [-1, 1].forEach(function (side) {
                    const localZ = side * d * 0.46;
                    const px = x + localX * Math.cos(angle) + localZ * Math.sin(angle);
                    const pz = z - localX * Math.sin(angle) + localZ * Math.cos(angle);
                    box(materials.timber, px, baseY + 0.20 + bodyHeight / 2, pz, grand ? 0.09 : 0.045, bodyHeight, grand ? 0.09 : 0.045);
                });
            }
        }

        function lantern(x, y, z, tall) {
            const height = tall ? 0.62 : 0.35;
            line(materials.darkGold, x, y, z, x, y + height, z, 0.018);
            instance(sphereGeometry, materials.glow, x, y + height, z, 0.058, 0.080, 0.058);
        }

        function tree(x, z, scale) {
            box(materials.timber, x, 0.12 + scale * 0.2, z, 0.06, scale * 0.4, 0.06);
            instance(sphereGeometry, materials.tree, x, 0.15 + scale * 0.55, z, scale * 0.26, scale * 0.31, scale * 0.26);
        }

        // Floating, stepped foundation: the complete city reads as one final scene.
        box(materials.foundation, 0, -0.40, 0, 25.8, 0.58, 25.8);
        box(materials.darkGold, 0, -0.11, 0, 25.0, 0.045, 25.0);
        box(materials.land, 0, -0.04, 0, 24.8, 0.16, 24.8);
        box(materials.street, 0, 0.047, 1.6, 1.65, 0.05, 19.9);
        [-0.87, 0.87].forEach(function (x) {
            box(materials.darkGold, x, 0.08, 1.65, 0.026, 0.03, 20.0);
        });
        [-5.1, -1.4, 2.2, 5.8, 9.4].forEach(function (z) {
            box(materials.street, 0, 0.06, z, 23.1, 0.035, 0.40);
        });
        [-10.2, -6.6, -2.6, 2.6, 6.6, 10.2].forEach(function (x) {
            box(materials.street, x, 0.06, 2.1, 0.30, 0.04, 15.0);
        });

        // Outer walls with a real opening at the principal south gate.
        [-1, 1].forEach(function (side) {
            box(materials.wall, side * 11.85, 0.41, 0, 0.42, 0.75, 24.1);
            box(materials.darkGold, side * 11.85, 0.80, 0, 0.47, 0.045, 24.1);
            box(materials.wall, side * 6.72, 0.41, 11.85, 10.3, 0.75, 0.42);
            box(materials.darkGold, side * 6.72, 0.80, 11.85, 10.3, 0.045, 0.47);
        });
        box(materials.wall, 0, 0.41, -11.85, 24.1, 0.75, 0.42);
        box(materials.darkGold, 0, 0.80, -11.85, 24.1, 0.045, 0.47);
        for (let p = -11.5; p <= 11.5; p += 0.64) {
            [-1, 1].forEach(function (side) {
                box(materials.wall, side * 11.85, 0.91, p, 0.43, 0.19, 0.27);
                if (side < 0 || Math.abs(p) > 1.7) box(materials.wall, p, 0.91, side * 11.85, 0.27, 0.19, 0.43);
            });
        }

        // Corner pavilions have layered, overhanging roofs instead of box silhouettes.
        [-11.75, 11.75].forEach(function (x) {
            [-11.75, 11.75].forEach(function (z) {
                box(materials.wall, x, 0.68, z, 1.45, 1.3, 1.45);
                hall(x, z, 1.14, 1.14, 1.25, 0.40, true);
            });
        });

        // Mingde Gate: three open passages carry a double-eaved gatehouse.
        [-1.50, -0.52, 0.52, 1.50].forEach(function (x) {
            box(materials.wall, x, 0.58, 11.85, 0.28, 1.14, 1.12);
        });
        box(materials.wall, 0, 1.21, 11.85, 3.5, 0.32, 1.4);
        hall(0, 11.85, 3.15, 1.25, 1.36, 0.61, true);
        roof(0, 1.75, 11.85, 4.10, 0.42, 1.92, true);
        [-2.25, 2.25].forEach(function (x) {
            box(materials.wall, x, 0.72, 11.85, 1.05, 1.35, 1.1);
            hall(x, 11.85, 0.95, 0.94, 1.3, 0.35, true);
            lantern(x, 1.32, 12.47, true);
        });

        // Sixteen walled wards, each built around a small open courtyard.
        const wardXs = [-8.40, -4.45, 4.45, 8.40];
        const wardZs = [-3.25, 0.40, 4.00, 7.60];
        wardXs.forEach(function (x, column) {
            wardZs.forEach(function (z, row) {
                const market = row === 1 && (column === 1 || column === 2);
                box(materials.foundation, x, 0.105, z, 3.24, 0.11, 2.98);
                box(materials.land, x, 0.17, z, 3.16, 0.05, 2.9);
                [-1, 1].forEach(function (side) {
                    box(materials.wall, x + side * 1.52, 0.35, z, 0.10, 0.34, 2.92);
                    box(materials.wall, x, 0.35, z + side * 1.40, 3.02, 0.34, 0.10);
                });
                if (market) {
                    [-0.93, 0.0, 0.93].forEach(function (dx) {
                        [-0.82, 0.82].forEach(function (dz) {
                            hall(x + dx, z + dz, 0.63, 0.63, 0.18, 0.27, false);
                            lantern(x + dx, 0.20, z + dz * 0.42, false);
                        });
                    });
                    box(materials.street, x, 0.20, z, 2.8, 0.025, 0.35);
                } else {
                    hall(x, z - 0.76, 2.0, 0.68, 0.18, row === 0 ? 0.42 : 0.32, false);
                    hall(x - 1.0, z + 0.16, 1.23, 0.52, 0.18, 0.26, false, Math.PI / 2);
                    hall(x + 1.0, z + 0.16, 1.23, 0.52, 0.18, 0.26, false, Math.PI / 2);
                    hall(x, z + 0.96, 1.0, 0.47, 0.18, 0.25, false);
                    tree(x - 0.4, z + 0.18, 0.58);
                    tree(x + 0.4, z + 0.18, 0.48);
                }
            });
        });

        // Northern palace enclosure and the axial ceremonial forecourt.
        box(materials.wall, 0, 0.22, -8.25, 12.4, 0.35, 5.9);
        box(materials.land, 0, 0.42, -8.25, 12.15, 0.05, 5.65);
        box(materials.street, 0, 0.46, -7.5, 2.1, 0.035, 4.6);
        [-1, 1].forEach(function (side) {
            box(materials.timber, side * 6.03, 0.83, -8.25, 0.16, 0.75, 5.7);
            for (let j = 0; j < 4; j++) {
                hall(side * 5.5, -10.25 + j * 1.42, 1.15, 0.69, 0.46, 0.48, false, Math.PI / 2);
            }
            hall(side * 3.9, -7.55, 2.2, 1.25, 0.46, 0.70, true);
            hall(side * 4.0, -10.2, 2.3, 1.1, 0.46, 0.65, true);
            hall(side * 4.25, -5.3, 2.7, 0.72, 0.43, 0.59, true);
            box(materials.timber, side * 1.22, 0.92, -5.30, 0.20, 0.96, 0.7);
        });
        roof(0, 1.46, -5.3, 3.4, 0.65, 1.30, true);
        box(materials.timber, 0, 1.38, -5.3, 2.65, 0.14, 0.85);
        // Three ascending terraces, steps, and a double roof crown the main hall.
        box(materials.wall, 0, 0.59, -9.1, 5.55, 0.30, 2.8);
        box(materials.darkGold, 0, 0.76, -9.1, 5.35, 0.045, 2.65);
        box(materials.wall, 0, 0.84, -9.1, 4.95, 0.15, 2.48);
        for (let step = 0; step < 5; step++) {
            box(materials.wall, 0, 0.47 + step * 0.075, -7.35 - step * 0.12, 2.10, 0.075, 0.26);
        }
        hall(0, -9.10, 4.60, 2.03, 0.91, 1.08, true);
        roof(0, 1.67, -9.10, 5.60, 0.57, 2.88, true);
        hall(0, -10.80, 2.65, 0.91, 0.46, 0.61, true);
        [-2.63, 2.63].forEach(function (x) {
            line(materials.gold, x, 0.46, -7.3, x, 1.8, -7.3, 0.025);
            box(materials.timber, x + 0.17, 1.52, -7.3, 0.35, 0.52, 0.018);
        });

        // A southern pagoda district creates a second recognizable skyline landmark.
        const pagodaX = 8.4;
        const pagodaZ = 7.6;
        // The pagoda rises from the existing ward courtyard.
        box(materials.wall, pagodaX, 0.34, pagodaZ, 1.15, 0.35, 1.15);
        for (let level = 0; level < 5; level++) {
            const width = 1.03 - level * 0.13;
            const y = 0.51 + level * 0.52;
            box(materials.plaster, pagodaX, y + 0.22, pagodaZ, width * 0.76, 0.43, width * 0.76);
            [-1, 1].forEach(function (side) {
                box(materials.timber, pagodaX + side * width * 0.387, y + 0.20, pagodaZ, 0.016, 0.23, 0.13);
                box(materials.timber, pagodaX, y + 0.20, pagodaZ + side * width * 0.387, 0.13, 0.23, 0.016);
            });
            roof(pagodaX, y + 0.40, pagodaZ, width * 1.25, 0.29, width * 1.25, true);
        }
        line(materials.gold, pagodaX, 3.15, pagodaZ, pagodaX, 3.72, pagodaZ, 0.025);
        instance(sphereGeometry, materials.gold, pagodaX, 3.64, pagodaZ, 0.065, 0.065, 0.065);

        // Warm lamps punctuate the ceremonial avenue; no per-lamp light sources.
        for (let z = -4.35; z < 11.1; z += 1.2) {
            [-1.02, 1.02].forEach(function (x) { lantern(x, 0.07, z, true); });
        }
        [-10.75, 10.75].forEach(function (x) {
            for (let z = -9.7; z < 10.7; z += 1.5) tree(x, z, 0.70);
        });

        // Every repeated primitive shares an instanced batch, keeping the city cheap.
        batches.forEach(function (batch) {
            const mesh = new THREE.InstancedMesh(batch.geometry, batch.material, batch.matrices.length);
            batch.matrices.forEach(function (transform, i) { mesh.setMatrixAt(i, transform); });
            mesh.instanceMatrix.needsUpdate = true;
            mesh.computeBoundingSphere();
            mesh.castShadow = false;
            mesh.receiveShadow = false;
            mesh.name = 'changan-batch-' + city.children.length;
            city.add(mesh);
        });

        city.userData.landmarks = [
            { name: '宫城', position: new THREE.Vector3(0, 3.40, -9.10) },
            { name: '朱雀大街', position: new THREE.Vector3(0, 0.45, 3.0) },
            { name: '明德门', position: new THREE.Vector3(0, 2.95, 11.85) },
            { name: '西市', position: new THREE.Vector3(-4.45, 1.15, 0.4) },
            { name: '东市', position: new THREE.Vector3(4.45, 1.15, 0.4) },
            { name: '佛寺塔影', position: new THREE.Vector3(pagodaX, 3.85, pagodaZ) }
        ];
        city.userData.description = '唐代长安城艺术示意，非考古复原。';
        city.userData.drawCalls = city.children.length;
        city.userData.dispose = function () {
            const geometries = new Set();
            const disposedMaterials = new Set();
            city.traverse(function (object) {
                if (object.geometry) geometries.add(object.geometry);
                if (object.material) disposedMaterials.add(object.material);
                if (object.isInstancedMesh && object.dispose) object.dispose();
            });
            geometries.forEach(function (geometry) { geometry.dispose(); });
            disposedMaterials.forEach(function (mat) { mat.dispose(); });
        };
        return city;
    };
})(window);
