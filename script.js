const snippet = `options:
    refresh_interval: 5 seconds
    fake_length: 5
    fake_prefix: &8&l&k
    hide_particles: true
    prevent_mob_target: true

function ai_generate_fake() :: text:
    set {_fake} to ""
    loop {@fake_length} times:
        set {_fake} to "%{_fake}%%random element out of {_chars::*}%"
    return {_fake}

on entity potion effect of invisibility added with priority highest:
    if event-entity is not a player:
        stop
    set {_p} to event-entity
    ai_prime_activation({_p})

on chat with priority highest:
    set {_uuid} to ai_uuid_text(player)
    if {actualinvis.active::%{_uuid}%} is not true:
        stop
    cancel event
    broadcast "%ai_visible_name(player)%: %message%"

on entity target with priority highest:
    if target is not a player:
        stop
    set {_target_uuid} to ai_uuid_text(target)
    if {actualinvis.active::%{_target_uuid}%} is true:
        cancel event
        reset target of entity`;

const downloadFileName = "actual_invisibility.sk";
const downloadSource = `# ============================================================
# Actual Invisibility
# Paper 1.21.11 + modern Skript on Paper
# ============================================================
#
# What this script does:
# - Activates automatically when a player gains invisibility
# - Hides the invisible player from other players
# - Replaces visible text surfaces with a fake obfuscated alias
# - Restores the original names when invisibility ends
# - Suppresses invisibility particles/icon and blocks mob targeting
#
# Notes:
# - This is a pure Skript implementation.
# - It is designed for vanilla/Skript-controlled chat, join/quit,
#   death, kick, tab, and server list surfaces.
# ============================================================

options:
    refresh_interval: 5 seconds
    fake_length: 5
    fake_charset: lowercase a-z
    fake_prefix: &8&l&k
    tab_mode: fake_name
    hide_particles: true
    prevent_mob_target: true


# ============================================================
# Helper functions
# ============================================================

function ai_uuid_text(p: player) :: text:
    return "%uuid of {_p}%"

function ai_clear_state(uuid_text: text):
    delete {actualinvis.active::%{_uuid_text}%}
    delete {actualinvis.fake_raw::%{_uuid_text}%}
    delete {actualinvis.fake_rendered::%{_uuid_text}%}
    delete {actualinvis.backup.display::%{_uuid_text}%}
    delete {actualinvis.backup.tab::%{_uuid_text}%}

function ai_generate_fake() :: text:
    set {_fake} to ""
    set {_chars::*} to "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"
    loop {@fake_length} times:
        set {_fake} to "%{_fake}%%random element out of {_chars::*}%"
    return {_fake}

function ai_render_alias(raw_fake: text) :: text:
    return "{@fake_prefix}%{_raw_fake}%&r"

function ai_visible_name(p: player) :: text:
    set {_uuid} to ai_uuid_text({_p})
    if {actualinvis.active::%{_uuid}%} is true:
        if {actualinvis.fake_rendered::%{_uuid}%} is not set:
            set {actualinvis.fake_raw::%{_uuid}%} to ai_generate_fake()
            set {actualinvis.fake_rendered::%{_uuid}%} to ai_render_alias({actualinvis.fake_raw::%{_uuid}%})
        return {actualinvis.fake_rendered::%{_uuid}%}
    return "%display name of {_p}%"

function ai_apply_effect_style(p: player):
    if {@hide_particles} is not true:
        stop
    set {_effect} to active invisibility effect of {_p}
    if {_effect} is not set:
        stop
    hide the particles of {_effect}
    hide the icon of {_effect}

function ai_clear_mob_targets(p: player):
    if {@prevent_mob_target} is not true:
        stop
    loop living entities in world of {_p}:
        if loop-entity is {_p}:
            next loop
        if loop-entity is a player:
            next loop
        if target of loop-entity is {_p}:
            reset target of loop-entity

function ai_hide_actives_from(viewer: player):
    if {_viewer} is not online:
        stop
    loop {actualinvis.active::*}:
        set {_tracked} to player("%loop-index%", true)
        if {_tracked} is not set:
            ai_clear_state("%loop-index%")
            next loop
        if {_tracked} is {_viewer}:
            next loop
        if {actualinvis.active::%loop-index%} is true:
            hide {_tracked} from {_viewer}

function ai_apply_state(p: player):
    set {_uuid} to ai_uuid_text({_p})
    if {actualinvis.active::%{_uuid}%} is not true:
        stop
    if {actualinvis.fake_rendered::%{_uuid}%} is not set:
        if {actualinvis.fake_raw::%{_uuid}%} is not set:
            set {actualinvis.fake_raw::%{_uuid}%} to ai_generate_fake()
        set {actualinvis.fake_rendered::%{_uuid}%} to ai_render_alias({actualinvis.fake_raw::%{_uuid}%})

    set display name of {_p} to {actualinvis.fake_rendered::%{_uuid}%}
    set tab list name of {_p} to {actualinvis.fake_rendered::%{_uuid}%}
    ai_apply_effect_style({_p})

    loop all players:
        if loop-player is {_p}:
            next loop
        hide {_p} from loop-player

    ai_clear_mob_targets({_p})

function ai_activate(p: player):
    if {_p} is not online:
        stop
    if {_p} does not have a potion effect of invisibility active:
        ai_deactivate({_p})
        stop

    set {_uuid} to ai_uuid_text({_p})
    set {actualinvis.active::%{_uuid}%} to true

    if {actualinvis.backup.display::%{_uuid}%} is not set:
        set {actualinvis.backup.display::%{_uuid}%} to display name of {_p}
    if {actualinvis.backup.tab::%{_uuid}%} is not set:
        set {actualinvis.backup.tab::%{_uuid}%} to tab list name of {_p}

    if {actualinvis.fake_raw::%{_uuid}%} is not set:
        set {actualinvis.fake_raw::%{_uuid}%} to ai_generate_fake()
    set {actualinvis.fake_rendered::%{_uuid}%} to ai_render_alias({actualinvis.fake_raw::%{_uuid}%})

    ai_apply_state({_p})

function ai_prime_activation(p: player):
    if {_p} is not online:
        stop

    set {_uuid} to ai_uuid_text({_p})
    set {actualinvis.active::%{_uuid}%} to true

    if {actualinvis.backup.display::%{_uuid}%} is not set:
        set {actualinvis.backup.display::%{_uuid}%} to display name of {_p}
    if {actualinvis.backup.tab::%{_uuid}%} is not set:
        set {actualinvis.backup.tab::%{_uuid}%} to tab list name of {_p}

    if {actualinvis.fake_raw::%{_uuid}%} is not set:
        set {actualinvis.fake_raw::%{_uuid}%} to ai_generate_fake()
    set {actualinvis.fake_rendered::%{_uuid}%} to ai_render_alias({actualinvis.fake_raw::%{_uuid}%})

    ai_apply_state({_p})

function ai_refresh(p: player):
    if {_p} is not online:
        stop
    if {_p} does not have a potion effect of invisibility active:
        ai_deactivate({_p})
        stop

    set {_uuid} to ai_uuid_text({_p})
    set {actualinvis.fake_raw::%{_uuid}%} to ai_generate_fake()
    set {actualinvis.fake_rendered::%{_uuid}%} to ai_render_alias({actualinvis.fake_raw::%{_uuid}%})
    ai_apply_state({_p})

function ai_deactivate(p: player):
    set {_uuid} to ai_uuid_text({_p})

    if {_p} is online:
        reveal {_p} to all players

        if {actualinvis.backup.display::%{_uuid}%} is set:
            set display name of {_p} to {actualinvis.backup.display::%{_uuid}%}
        else:
            set display name of {_p} to name of {_p}

        if {actualinvis.backup.tab::%{_uuid}%} is set:
            set tab list name of {_p} to {actualinvis.backup.tab::%{_uuid}%}
        else:
            set tab list name of {_p} to name of {_p}

    ai_clear_state({_uuid})


# ============================================================
# Load / startup resync
# ============================================================

on load:
    wait 1 tick

    loop {actualinvis.active::*}:
        set {_tracked} to player("%loop-index%", true)
        if {_tracked} is not set:
            ai_clear_state("%loop-index%")
            next loop
        if {_tracked} has a potion effect of invisibility active:
            ai_activate({_tracked})
        else:
            ai_deactivate({_tracked})

    loop all players:
        if loop-player has a potion effect of invisibility active:
            ai_activate(loop-player)
        else:
            ai_deactivate(loop-player)


# ============================================================
# Invisibility activation / deactivation
# ============================================================

on entity potion effect of invisibility added with priority highest:
    if event-entity is not a player:
        stop
    set {_p} to event-entity
    ai_prime_activation({_p})

    wait 1 tick
    if {_p} is online:
        ai_activate({_p})

    wait 4 ticks
    if {_p} is online:
        ai_activate({_p})

on entity potion effect of invisibility changed with priority highest:
    if event-entity is not a player:
        stop
    set {_p} to event-entity
    ai_prime_activation({_p})

on entity potion effect of invisibility removed with priority highest:
    if event-entity is not a player:
        stop
    ai_deactivate(event-entity)

on entity potion effect of invisibility cleared with priority highest:
    if event-entity is not a player:
        stop
    ai_deactivate(event-entity)


# ============================================================
# Chat / join / quit / kick / death message protection
# ============================================================

on chat with priority highest:
    set {_uuid} to ai_uuid_text(player)
    if {actualinvis.active::%{_uuid}%} is not true:
        stop

    cancel event
    broadcast "%ai_visible_name(player)%: %message%"

on join with priority highest:
    set {_joining} to player

    if {_joining} has a potion effect of invisibility active:
        ai_activate({_joining})
        set join message to "%ai_visible_name({_joining})% joined the game"

    ai_hide_actives_from({_joining})

    wait 1 tick
    if {_joining} is online:
        if {_joining} has a potion effect of invisibility active:
            ai_activate({_joining})
        ai_hide_actives_from({_joining})

    wait 4 ticks
    if {_joining} is online:
        if {_joining} has a potion effect of invisibility active:
            ai_activate({_joining})
        ai_hide_actives_from({_joining})

on kick with priority highest:
    set {_uuid} to ai_uuid_text(player)
    if {actualinvis.active::%{_uuid}%} is true:
        set kick message to "%ai_visible_name(player)% left the game"

on quit with priority highest:
    set {_uuid} to ai_uuid_text(player)

    if quit reason is kicked:
        clear quit message
    else if {actualinvis.active::%{_uuid}%} is true:
        set quit message to "%ai_visible_name(player)% left the game"

    ai_clear_state({_uuid})

on death of player with priority highest:
    set {_victim} to victim
    set {_victim_uuid} to ai_uuid_text({_victim})
    set {_victim_hidden} to false
    set {_killer_hidden} to false

    if {actualinvis.active::%{_victim_uuid}%} is true:
        set {_victim_hidden} to true

    delete {_killer}
    if attacker is a player:
        set {_killer} to attacker
    else if last attacker of {_victim} is a player:
        set {_killer} to last attacker of {_victim}

    if {_killer} is set:
        set {_killer_uuid} to ai_uuid_text({_killer})
        if {actualinvis.active::%{_killer_uuid}%} is true:
            set {_killer_hidden} to true

    if {_killer} is set:
        if {_victim_hidden} is true or {_killer_hidden} is true:
            set death message to "%ai_visible_name({_victim})% was slain by %ai_visible_name({_killer})%"
    else if {_victim_hidden} is true:
        set death message to "%ai_visible_name({_victim})% died"


# ============================================================
# Tab/server list protection
# ============================================================

on server list ping:
    loop {actualinvis.active::*}:
        set {_tracked} to player("%loop-index%", true)
        if {_tracked} is not set:
            ai_clear_state("%loop-index%")
            next loop
        hide {_tracked} from the server list


# ============================================================
# Mob targeting protection
# ============================================================

on entity target with priority highest:
    if {@prevent_mob_target} is not true:
        stop
    if target is not a player:
        stop

    set {_target_uuid} to ai_uuid_text(target)
    if {actualinvis.active::%{_target_uuid}%} is true:
        cancel event
        reset target of entity


# ============================================================
# Periodic refresh
# ============================================================

every {@refresh_interval}:
    loop {actualinvis.active::*}:
        set {_tracked} to player("%loop-index%", true)
        if {_tracked} is not set:
            ai_clear_state("%loop-index%")
            next loop

        if {_tracked} has a potion effect of invisibility active:
            ai_refresh({_tracked})
        else:
            ai_deactivate({_tracked})`;

const topbar = document.querySelector(".topbar");
const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");
const navLinks = Array.from(document.querySelectorAll(".site-nav a[href^='#']"));
const heroStage = document.querySelector(".showcase-frame");
const particleField = document.querySelector(".particle-field");
const codeTarget = document.getElementById("skript-code");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function escapeHtml(value) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

function highlightSkript(source) {
    const keywordPattern = /\b(options|function|on|if|else|loop|set|return|wait|stop|cancel|broadcast|hide|reveal|reset)\b/g;

    return source
        .split("\n")
        .map((line) => {
            if (/^\s*#/.test(line)) {
                return `<span class="token-comment">${escapeHtml(line)}</span>`;
            }

            const stash = [];
            const hold = (markup) => `__TOKEN_${stash.push(markup) - 1}__`;
            let html = escapeHtml(line);

            html = html.replace(/"[^"]*"/g, (match) => hold(`<span class="token-string">${match}</span>`));
            html = html.replace(/(\{_[^}]+\}|%\{_[^%]+\}%)/g, (match) => hold(`<span class="token-variable">${match}</span>`));
            html = html.replace(/(\{@[a-z_]+\})/gi, (match) => hold(`<span class="token-option">${match}</span>`));
            html = html.replace(/\b(true|false)\b/g, (match) => hold(`<span class="token-boolean">${match}</span>`));
            html = html.replace(/\b(\d+(?:\.\d+)?)\b/g, (match) => hold(`<span class="token-number">${match}</span>`));
            html = html.replace(/(^\s*function\s+)([a-z0-9_]+)/i, (_, prefix, name) => `${prefix}${hold(`<span class="token-function">${name}</span>`)}`);
            html = html.replace(keywordPattern, (match) => hold(`<span class="token-keyword">${match}</span>`));

            return html.replace(/__TOKEN_(\d+)__/g, (_, index) => stash[Number(index)]);
        })
        .join("\n");
}

function setTopbarState() {
    if (window.scrollY > 20) {
        topbar.classList.add("is-scrolled");
    } else {
        topbar.classList.remove("is-scrolled");
    }

    const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const progress = Math.min((window.scrollY / maxScroll) * 100, 100);
    document.documentElement.style.setProperty("--scroll-progress", `${progress}%`);
}

function closeNav() {
    if (!menuToggle || !siteNav) {
        return;
    }
    menuToggle.setAttribute("aria-expanded", "false");
    siteNav.classList.remove("is-open");
}

function createParticles() {
    if (!particleField || reducedMotion) {
        return;
    }

    const total = window.innerWidth < 760 ? 14 : 24;
    for (let index = 0; index < total; index += 1) {
        const particle = document.createElement("span");
        particle.className = "particle";

        const size = Math.random() * 8 + 3;
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        const duration = Math.random() * 8 + 8;
        const delay = Math.random() * -12;
        const driftX = `${Math.random() * 32 - 16}px`;
        const driftY = `${Math.random() * 120 + 30}px`;

        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${left}%`;
        particle.style.top = `${top}%`;
        particle.style.animationDuration = `${duration}s`;
        particle.style.animationDelay = `${delay}s`;
        particle.style.setProperty("--drift-x", driftX);
        particle.style.setProperty("--drift-y", driftY);

        particleField.appendChild(particle);
    }
}

function setupActiveNav() {
    if (!navLinks.length || !("IntersectionObserver" in window)) {
        return;
    }

    const sectionMap = new Map();
    navLinks.forEach((link) => {
        const id = link.getAttribute("href");
        if (!id) {
            return;
        }
        const section = document.querySelector(id);
        if (section) {
            sectionMap.set(section, link);
        }
    });

    const setActive = (activeLink) => {
        navLinks.forEach((link) => link.classList.toggle("is-active", link === activeLink));
    };

    setActive(navLinks[0]);

    const observer = new IntersectionObserver(
        (entries) => {
            const visible = entries
                .filter((entry) => entry.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

            if (visible) {
                setActive(sectionMap.get(visible.target));
            }
        },
        {
            threshold: [0.2, 0.45, 0.7],
            rootMargin: "-20% 0px -45% 0px"
        }
    );

    sectionMap.forEach((_, section) => observer.observe(section));
}

function applyRevealObserver() {
    const nodes = document.querySelectorAll(".reveal");

    if (reducedMotion || !("IntersectionObserver" in window)) {
        nodes.forEach((node) => node.classList.add("is-visible"));
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.18,
            rootMargin: "0px 0px -6% 0px"
        }
    );

    nodes.forEach((node) => observer.observe(node));
}

function fallbackCopy(value) {
    const ghost = document.createElement("textarea");
    ghost.value = value;
    ghost.setAttribute("readonly", "");
    ghost.style.position = "fixed";
    ghost.style.opacity = "0";
    ghost.style.pointerEvents = "none";
    document.body.appendChild(ghost);
    ghost.select();
    const result = document.execCommand("copy");
    document.body.removeChild(ghost);
    return result;
}

async function copyTextValue(value) {
    if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
        return true;
    }

    const copied = fallbackCopy(value);
    if (!copied) {
        throw new Error("Clipboard fallback failed.");
    }

    return true;
}

function setupCopyButton() {
    const copyButton = document.querySelector(".copy-button");
    if (!copyButton) {
        return;
    }

    copyButton.addEventListener("click", async () => {
        try {
            await copyTextValue(snippet);
            const label = copyButton.querySelector("span:last-child");
            copyButton.classList.add("is-copied");
            if (label) {
                label.textContent = "Copied";
            }
            window.setTimeout(() => {
                copyButton.classList.remove("is-copied");
                if (label) {
                    label.textContent = "Copy Snippet";
                }
            }, 1800);
        } catch (error) {
            const label = copyButton.querySelector("span:last-child");
            if (label) {
                label.textContent = "Copy failed";
            }
            window.setTimeout(() => {
                if (label) {
                    label.textContent = "Copy Snippet";
                }
            }, 1600);
        }
    });
}

function setupCommandCopyButtons() {
    document.querySelectorAll(".command-copy").forEach((button) => {
        button.addEventListener("click", async () => {
            const value = button.getAttribute("data-copy-text");
            if (!value) {
                return;
            }

            try {
                await copyTextValue(value);
                button.classList.add("is-copied");
                window.setTimeout(() => {
                    button.classList.remove("is-copied");
                }, 1400);
            } catch (error) {
                button.classList.remove("is-copied");
            }
        });
    });
}

function setupRippleTargets() {
    document.querySelectorAll(".ripple-target").forEach((node) => {
        node.addEventListener("click", (event) => {
            if (node.classList.contains("is-disabled")) {
                event.preventDefault();
                return;
            }

            const rect = node.getBoundingClientRect();
            const ripple = document.createElement("span");
            ripple.className = "ripple";
            ripple.style.left = `${event.clientX - rect.left}px`;
            ripple.style.top = `${event.clientY - rect.top}px`;
            node.appendChild(ripple);
            window.setTimeout(() => ripple.remove(), 700);
        });
    });
}

function setupHeroParallax() {
    if (!heroStage || reducedMotion) {
        return;
    }

    const reset = () => {
        heroStage.style.setProperty("--stage-x", "0.5");
        heroStage.style.setProperty("--stage-y", "0.5");
    };

    heroStage.addEventListener("pointermove", (event) => {
        const bounds = heroStage.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width;
        const y = (event.clientY - bounds.top) / bounds.height;
        heroStage.style.setProperty("--stage-x", `${x.toFixed(3)}`);
        heroStage.style.setProperty("--stage-y", `${y.toFixed(3)}`);
    });

    heroStage.addEventListener("pointerleave", reset);
    reset();
}

function setupMenu() {
    if (!menuToggle || !siteNav) {
        return;
    }

    menuToggle.addEventListener("click", () => {
        const expanded = menuToggle.getAttribute("aria-expanded") === "true";
        menuToggle.setAttribute("aria-expanded", String(!expanded));
        siteNav.classList.toggle("is-open", !expanded);
    });

    siteNav.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", closeNav);
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 760) {
            closeNav();
        }
    });
}

function setupDisabledLinks() {
    document.querySelectorAll('a[aria-disabled="true"]').forEach((link) => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
        });
    });
}

function setupDownloadButtons() {
    document.querySelectorAll("[data-download-file]").forEach((button) => {
        button.addEventListener("click", () => {
            const blob = new Blob([downloadSource], { type: "text/plain;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            const label = button.querySelector("span:last-child");
            const originalLabel = label ? label.textContent : "";

            anchor.href = url;
            anchor.download = button.getAttribute("data-download-file") || downloadFileName;
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
            window.setTimeout(() => URL.revokeObjectURL(url), 1000);

            if (label) {
                label.textContent = "Downloading";
                window.setTimeout(() => {
                    label.textContent = originalLabel;
                }, 1400);
            }
        });
    });
}

function initializeIcons() {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
        window.lucide.createIcons();
    }
}

codeTarget.innerHTML = highlightSkript(snippet);
initializeIcons();
setTopbarState();
createParticles();
applyRevealObserver();
setupCopyButton();
setupCommandCopyButtons();
setupRippleTargets();
setupHeroParallax();
setupMenu();
setupActiveNav();
setupDisabledLinks();
setupDownloadButtons();

window.addEventListener("scroll", setTopbarState, { passive: true });
window.addEventListener("load", initializeIcons);
