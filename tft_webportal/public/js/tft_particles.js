frappe.ready(() => {
    function shouldAttachToLogin() {
        if (document.getElementById("particles-js")) {
            return true;
        }
        if (document.querySelector(".for-login, .for-signup, .for-forgot")) {
            return true;
        }
        const path = window.location.pathname || "";
        const hash = window.location.hash || "";
        return (
            path.indexOf("login") !== -1 ||
            hash.indexOf("login") !== -1 ||
            hash.indexOf("signup") !== -1 ||
            hash.indexOf("forgot") !== -1
        );
    }

    function initParticles() {
        let host = document.getElementById("particles-js");
        if (!host && shouldAttachToLogin()) {
            host = document.createElement("div");
            host.id = "particles-js";
            document.body.prepend(host);
        }
        if (!host) {
            return;
        }

        host.style.position = "fixed";
        host.style.inset = "0";
        host.style.zIndex = "0";
        host.style.pointerEvents = "none";
        host.style.width = "100%";
        host.style.height = "100%";

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        host.appendChild(canvas);

        const opts = {
            particleCount: 45,
            maxRadius: 2.4,
            minRadius: 0.9,
            speed: 0.3,
            linkDistance: 110,
            bg: "transparent",
            particleColor: "rgba(24, 90, 42, 0.5)",
            linkColor: "rgba(24, 90, 42, 0.35)",
            glowColor: "rgba(255, 255, 255, 0)",
        };

        const state = {
            width: 0,
            height: 0,
            particles: [],
            raf: null,
            paused: false,
        };

        function resize() {
            state.width = window.innerWidth;
            state.height = window.innerHeight;
            canvas.width = state.width * window.devicePixelRatio;
            canvas.height = state.height * window.devicePixelRatio;
            canvas.style.width = `${state.width}px`;
            canvas.style.height = `${state.height}px`;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        }

        function makeParticle() {
            return {
                x: Math.random() * state.width,
                y: Math.random() * state.height,
                vx: (Math.random() - 0.5) * opts.speed,
                vy: (Math.random() - 0.5) * opts.speed,
                r: opts.minRadius + Math.random() * (opts.maxRadius - opts.minRadius),
            };
        }

        function initParticlesList() {
            state.particles = Array.from({ length: opts.particleCount }, makeParticle);
        }

        function draw() {
            if (state.paused) {
                state.raf = window.requestAnimationFrame(draw);
                return;
            }
            ctx.clearRect(0, 0, state.width, state.height);
            ctx.fillStyle = opts.glowColor;
            ctx.fillRect(0, 0, state.width, state.height);
            ctx.fillStyle = opts.particleColor;

            for (const p of state.particles) {
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < -10) p.x = state.width + 10;
                if (p.x > state.width + 10) p.x = -10;
                if (p.y < -10) p.y = state.height + 10;
                if (p.y > state.height + 10) p.y = -10;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.strokeStyle = opts.linkColor;
            ctx.lineWidth = 1.1;
            for (let i = 0; i < state.particles.length; i += 1) {
                for (let j = i + 1; j < state.particles.length; j += 1) {
                    const a = state.particles[i];
                    const b = state.particles[j];
                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    const dist = Math.hypot(dx, dy);
                    if (dist < opts.linkDistance) {
                        const alpha = 1 - dist / opts.linkDistance;
                        ctx.globalAlpha = alpha;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();
                    }
                }
            }
            ctx.globalAlpha = 1;

            state.raf = window.requestAnimationFrame(draw);
        }

        function start() {
            resize();
            initParticlesList();
            draw();
        }

        window.addEventListener("resize", () => {
            window.cancelAnimationFrame(state.raf);
            start();
        });

        document.addEventListener("visibilitychange", () => {
            state.paused = document.hidden;
        });

        start();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initParticles);
    } else {
        initParticles();
    }
});
