const topics = [
    {
        week: 'WEEK 01',
        title: 'Mindset and Support',
        summary: 'Don’t think like a student. Be your own biggest fan. HTML is the skeleton, CSS adds visuals and design, and JavaScript adds animation and responsiveness.',
        color: 0xef6848,
        position: [-3.6, -0.62, 0.15]
    },
    {
        week: 'WEEK 02',
        title: 'Web Development',
        summary: 'Explore AI-powered websites, collaboration-based development sessions, and expanded web development frameworks by putting Week 1 lessons into action.',
        color: 0xe3bb58,
        position: [-1.2, 0.72, -0.35]
    },
    {
        week: 'WEEK 03',
        title: 'Storytelling',
        summary: 'SEEK is a briefing process for preparing a full story outline. AAA stands for Attention, Action, and Amplification.',
        color: 0x83b9a2,
        position: [1.25, -0.38, 0.35]
    },
    {
        week: 'WEEK 04',
        title: 'Enhanced Storytelling Frameworks',
        summary: 'Learn the PEEK framework, apply a storytelling outline to web development, and implement 3D website elements with Babylon.',
        color: 0x83a8e3,
        position: [3.65, 0.68, -0.1]
    }
];

const canvas = document.querySelector('#renderCanvas');
const stage = document.querySelector('.concept-stage');
const status = document.querySelector('#scene-status');
const resetButton = document.querySelector('#reset-view');
const weekReadout = document.querySelector('#concept-week');
const titleReadout = document.querySelector('#concept-title');
const summaryReadout = document.querySelector('#concept-summary');

async function startScene() {
    try {
        const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js');
        initializeScene(THREE);
    } catch (error) {
        status.textContent = 'The 3D scene could not load. Check your connection and reload the page.';
        console.error('Unable to load the 3D scene:', error);
    }
}

function initializeScene(THREE) {
    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    } catch (error) {
        status.textContent = 'WebGL is unavailable in this browser, so the 3D scene cannot be displayed.';
        console.error('Unable to initialize WebGL:', error);
        return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x18241f);
    scene.fog = new THREE.Fog(0x18241f, 12, 25);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 50);
    const ambientLight = new THREE.HemisphereLight(0xe5f0e7, 0x26352d, 2.15);
    const keyLight = new THREE.DirectionalLight(0xffedcf, 2.2);
    keyLight.position.set(-3, 5, 6);
    scene.add(ambientLight, keyLight);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    const starPositions = new Float32Array(900);
    for (let index = 0; index < starPositions.length; index += 3) {
        starPositions[index] = (Math.random() - 0.5) * 19;
        starPositions[index + 1] = (Math.random() - 0.5) * 11;
        starPositions[index + 2] = -3 - Math.random() * 8;
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    const stars = new THREE.Points(
        starGeometry,
        new THREE.PointsMaterial({ color: 0xb9c7bc, size: 0.018, transparent: true, opacity: 0.58 })
    );
    scene.add(stars);

    const curve = new THREE.CatmullRomCurve3(topics.map((topic) => new THREE.Vector3(...topic.position)));
    const path = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 100, 0.012, 6, false),
        new THREE.MeshBasicMaterial({ color: 0x93a99a, transparent: true, opacity: 0.5 })
    );
    scene.add(path);

    const nodes = topics.map((topic, index) => {
        const group = new THREE.Group();
        group.position.set(...topic.position);

        const material = new THREE.MeshStandardMaterial({
            color: topic.color,
            emissive: topic.color,
            emissiveIntensity: 0.28,
            roughness: 0.32,
            metalness: 0.12
        });
        const core = new THREE.Mesh(new THREE.IcosahedronGeometry(index === 0 ? 0.48 : 0.39, 2), material);
        group.add(core);

        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(index === 0 ? 0.68 : 0.57, 0.012, 8, 72),
            new THREE.MeshBasicMaterial({ color: topic.color, transparent: true, opacity: 0.68 })
        );
        ring.rotation.x = Math.PI * 0.38 + index * 0.16;
        ring.rotation.y = Math.PI * 0.18;
        group.add(ring);

        const halo = new THREE.PointLight(topic.color, 1.5, 3.2);
        halo.position.set(0, 0, 0.2);
        group.add(halo);

        group.userData = { topic, core, ring, baseY: topic.position[1] };
        scene.add(group);
        return group;
    });

    const labels = topics.map((topic, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'scene-node-label';
        button.textContent = topic.title;
        button.setAttribute('aria-label', `${topic.week}: ${topic.title}`);
        button.style.setProperty('--node-color', `#${topic.color.toString(16).padStart(6, '0')}`);
        button.addEventListener('click', () => selectTopic(index));
        stage.append(button);
        return button;
    });

    let theta = -0.08;
    let phi = Math.PI / 2.05;
    let distance = 9.8;
    let startingDistance = 9.8;
    let pointerStart = null;
    let dragging = false;
    let selectedIndex = 0;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const clock = new THREE.Clock();
    const projected = new THREE.Vector3();

    function selectTopic(index) {
        selectedIndex = index;
        const topic = topics[index];
        weekReadout.textContent = topic.week;
        titleReadout.textContent = topic.title;
        summaryReadout.textContent = topic.summary;
        nodes.forEach((node, nodeIndex) => {
            node.userData.core.material.emissiveIntensity = nodeIndex === index ? 0.7 : 0.22;
            labels[nodeIndex].setAttribute('aria-pressed', String(nodeIndex === index));
        });
    }

    function updateCamera() {
        const safePhi = THREE.MathUtils.clamp(phi, 0.24, Math.PI - 0.24);
        camera.position.set(
            distance * Math.sin(safePhi) * Math.sin(theta),
            distance * Math.cos(safePhi),
            distance * Math.sin(safePhi) * Math.cos(theta)
        );
        camera.lookAt(0, 0, 0);
        updateLabels();
    }

    function resize() {
        const { width, height } = stage.getBoundingClientRect();
        if (!width || !height) return;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        startingDistance = Math.max(9.8, 18 / camera.aspect);
        distance = startingDistance;
        renderer.setSize(width, height, false);
        updateCamera();
    }

    function updateLabels() {
        nodes.forEach((node, index) => {
            projected.copy(node.position).project(camera);
            const visible = projected.z > -1 && projected.z < 1;
            labels[index].hidden = !visible;
            if (visible) {
                const x = (projected.x * 0.5 + 0.5) * stage.clientWidth;
                const y = (projected.y * -0.5 + 0.5) * stage.clientHeight;
                labels[index].style.left = `${x}px`;
                labels[index].style.top = `${y + 44}px`;
            }
        });
    }

    function pointerPosition(event) {
        const bounds = canvas.getBoundingClientRect();
        pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
        pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    }

    function onPointerDown(event) {
        if (event.button !== 0) return;
        pointerStart = {
            originX: event.clientX,
            originY: event.clientY,
            x: event.clientX,
            y: event.clientY
        };
        dragging = true;
        canvas.setPointerCapture(event.pointerId);
    }

    function onPointerMove(event) {
        if (!dragging || !pointerStart) return;
        const deltaX = event.clientX - pointerStart.x;
        const deltaY = event.clientY - pointerStart.y;
        theta -= deltaX * 0.006;
        phi -= deltaY * 0.006;
        pointerStart.x = event.clientX;
        pointerStart.y = event.clientY;
        updateCamera();
    }

    function onPointerUp(event) {
        if (!dragging || !pointerStart) return;
        const moved = Math.hypot(event.clientX - pointerStart.originX, event.clientY - pointerStart.originY);
        dragging = false;
        if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
        if (moved < 5) {
            pointerPosition(event);
            raycaster.setFromCamera(pointer, camera);
            const hit = raycaster.intersectObjects(nodes.map((node) => node.userData.core))[0];
            if (hit) selectTopic(nodes.indexOf(hit.object.parent));
        }
        pointerStart = null;
    }

    function onKeyDown(event) {
        const step = 0.12;
        if (event.key === 'ArrowLeft') theta -= step;
        else if (event.key === 'ArrowRight') theta += step;
        else if (event.key === 'ArrowUp') phi -= step;
        else if (event.key === 'ArrowDown') phi += step;
        else return;
        event.preventDefault();
        updateCamera();
    }

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('keydown', onKeyDown);
    canvas.addEventListener('wheel', (event) => {
        event.preventDefault();
        distance = THREE.MathUtils.clamp(distance + event.deltaY * 0.006, 6.8, Math.max(15, startingDistance));
        updateCamera();
    }, { passive: false });
    resetButton.addEventListener('click', () => {
        theta = -0.08;
        phi = Math.PI / 2.05;
        distance = startingDistance;
        updateCamera();
    });
    window.addEventListener('resize', resize);

    function animate() {
        const elapsed = clock.getElapsedTime();
        nodes.forEach((node, index) => {
            node.rotation.y = elapsed * (index % 2 === 0 ? 0.14 : -0.12);
            node.userData.ring.rotation.z = Math.sin(elapsed * 0.35 + index) * 0.12;
        });
        stars.rotation.y = Math.sin(elapsed * 0.035) * 0.025;
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }

    selectTopic(selectedIndex);
    resize();
    resetButton.disabled = false;
    status.textContent = '';
    animate();
}

startScene();