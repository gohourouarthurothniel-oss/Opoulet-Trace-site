/* ============================================================
   O'POULET — script.js
   Interactions : navbar, smooth scroll, apparitions, onglets,
   boutons WhatsApp, horaires, diaporama hero.
   Vanilla JS — aucune dépendance.
   ============================================================ */
'use strict';

/* ============================================================
   0) WHATSAPP — constante + aide partagées (définition unique)
   ============================================================ */
var OP_PHONE_WA = '2250708318118'; // 07 08 31 81 18 (fiche Google + carte officielle)
var OP_WA_DEFAULT_MSG = "Bonjour O'Poulet Tracé Plus ! Je voudrais commander.";

/* URL wa.me avec message encodé correctement (une seule source de vérité) */
function opWaUrl(message) {
  return (
    'https://wa.me/' +
    OP_PHONE_WA +
    '?text=' +
    encodeURIComponent(message || OP_WA_DEFAULT_MSG)
  );
}

/* Ouverture wa.me : fenêtre séparée + relâchement complet de l'opener */
function opWaOpen(url) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

(function () {
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================================
     1) NAVBAR — état au scroll (fond crème une fois dépassé le hero)
     ============================================================ */
  var navbar = document.getElementById('navbar');
  var lastScrollY = -1;
  var ticking = false;

  function updateNavbar(y) {
    navbar.classList.toggle('navbar--scrolled', y > 40);
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    lastScrollY = window.scrollY || window.pageYOffset;
    if (!ticking && lastScrollY !== undefined) {
      window.requestAnimationFrame(function () { updateNavbar(lastScrollY); });
      ticking = true;
    }
  }, { passive: true });

  updateNavbar(window.scrollY || 0);

  /* ============================================================
     2) MENU MOBILE (burger) — accessibilité : ARIA + Échap
     ============================================================ */
  var burger = document.getElementById('nav-burger');
  var navMenu = document.getElementById('nav-menu');

  function setMenu(open) {
    navMenu.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fermer le menu de navigation' : 'Ouvrir le menu de navigation');
  }

  burger.addEventListener('click', function () {
    setMenu(!navMenu.classList.contains('is-open'));
  });

  document.addEventListener('keydown', function (e) {
    /* Guard : si la modale panier est ouverte, c'est elle qui répond à Échap */
    if (
      e.key === 'Escape' &&
      navMenu.classList.contains('is-open') &&
      !document.body.classList.contains('cart-is-open')
    ) {
      setMenu(false);
      burger.focus();
    }
  });

  /* Clic en dehors du menu => fermeture */
  document.addEventListener('click', function (e) {
    if (navMenu.classList.contains('is-open') &&
        !navMenu.contains(e.target) && !burger.contains(e.target)) {
      setMenu(false);
    }
  });

  /* Fermer le menu mobile après un clic sur un lien du menu */
  navMenu.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () { setMenu(false); });
  });

  /* ============================================================
     3) DÉFILEMENT DOUX (smooth scroll JS + décalage navbar)
     ============================================================ */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var id = anchor.getAttribute('href');
      if (!id || id === '#') return;
      var target = document.querySelector(id);
      if (!target) return;
      /* Modale panier ouverte : on laisse passer le clic, la fermeture
         de la modale s'exécute et l'ancre saute ensuite naturellement
         (scrollIntoView serait no-op tant que le body est verrouillé) */
      if (document.body.classList.contains('cart-is-open')) return;
      e.preventDefault();
      target.scrollIntoView({
        behavior: REDUCED ? 'auto' : 'smooth',
        block: 'start'
      });
      /* Focus accessible sur la section atteinte */
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });

  /* ============================================================
     4) APPARITION FLUIDE AU SCROLL (IntersectionObserver)
     ============================================================ */
  var revealEls = document.querySelectorAll('.reveal');

  if (REDUCED || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('in-view'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      var index = 0;
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        /* Échelonnement au sein du même lot visible */
        if (!el.style.getPropertyValue('--reveal-delay') && !/\breveal--d\d\b/.test(el.className)) {
          el.style.setProperty('--reveal-delay', Math.min(index * 80, 480) + 'ms');
          index++;
        }
        el.classList.add('in-view');
        obs.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ============================================================
     5) SURLIGNAGE DU LIEN DE NAVIGATION ACTIF
     ============================================================ */
  var sections = document.querySelectorAll('main section[id]');
  var navLinks = document.querySelectorAll('.nav-link');

  if ('IntersectionObserver' in window) {
    var spyObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.getAttribute('id');
        navLinks.forEach(function (link) {
          var isActive = link.getAttribute('href') === '#' + id;
          link.classList.toggle('is-active', isActive);
          if (isActive) { link.removeAttribute('aria-current'); link.setAttribute('aria-current', 'true'); }
          else { link.removeAttribute('aria-current'); }
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(function (s) { spyObserver.observe(s); });
  }

  /* ============================================================
     6) ONGLETS DE LA CARTE (filtrage par catégorie)
     Sémantique tabs complète : aria-selected, roving tabindex,
     flèches/Origine/Fin au clavier, aria-labelledby du panneau,
     et rail de la carte remis au début à chaque filtre.
     ============================================================ */
  var tabs = document.querySelectorAll('.menu__tabs .tab');
  var items = document.querySelectorAll('.menu-item[data-cat]');
  var groups = document.querySelectorAll('[data-group]');

  function activerOnglet(tab) {
    var filter = tab.getAttribute('data-filter');

    tabs.forEach(function (t) {
      var active = t === tab;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', String(active));
      t.tabIndex = active ? 0 : -1; /* roving tabindex */
    });

    items.forEach(function (item) {
      var match = filter === 'all' || item.getAttribute('data-cat') === filter;
      item.classList.toggle('is-hidden', !match);
    });

    /* Masque les groupes sans aucun élément visible */
    groups.forEach(function (group) {
      var visibleCount = group.querySelectorAll('.menu-item:not(.is-hidden)').length;
      group.classList.toggle('is-hidden', visibleCount === 0);
    });

    /* Panneau : le libellé suit l'onglet actif */
    var panel = document.getElementById('menu-panel');
    if (panel && tab.id) panel.setAttribute('aria-labelledby', tab.id);

    /* La liste est affichée en grille : aucun rail à repositionner. */
  }

  tabs.forEach(function (t) {
    t.tabIndex = t.classList.contains('is-active') ? 0 : -1;
  });

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      activerOnglet(tab);
    });
  });

  /* Clavier : ← → Home End déplacent la sélection (motif ARIA tabs) */
  tabs.forEach(function (tab, index) {
    tab.addEventListener('keydown', function (e) {
      var total = tabs.length;
      var next = null;
      if (e.key === 'ArrowRight') next = (index + 1) % total;
      else if (e.key === 'ArrowLeft') next = (index - 1 + total) % total;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = total - 1;
      if (next === null) return;
      e.preventDefault();
      tabs[next].focus();
      activerOnglet(tabs[next]);
    });
  });

  /* ============================================================
     7) BOUTONS WHATSAPP PAR PLAT (message pré-rempli)
     ============================================================ */
  document.querySelectorAll('button[data-order]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var dish = btn.getAttribute('data-order') || '';
      var message = "Bonjour O'Poulet Tracé Plus ! Je voudrais commander : " + dish + '. Merci !';
      opWaOpen(opWaUrl(message));

      /* Retour visuel léger */
      btn.classList.add('is-ordered');
      setTimeout(function () { btn.classList.remove('is-ordered'); }, 600);
    });
  });

  /* ============================================================
     8) HORAIRES — la maison est ouverte 24 h / 24, 7 j / 7.
     Le statut s'affiche directement en dur dans index.html ;
     aucune logique nocturne n'est nécessaire.
     ============================================================ */

  /* ============================================================
     9) DIAPORAMA DU HERO (crossfade — désactivé si motion réduit)
     ============================================================ */
  var slides = document.querySelectorAll('.hero__slide');

  if (slides.length > 1 && !REDUCED) {
    var current = 0;
    setInterval(function () {
      if (document.hidden) return;          /* pause si l'onglet est caché */
      slides[current].classList.remove('hero__slide--active');
      current = (current + 1) % slides.length;
      slides[current].classList.add('hero__slide--active');
    }, 5500);
  }

  /* ============================================================
     10) ANNÉE DYNAMIQUE DU FOOTER
     ============================================================ */
  var yearEl = document.getElementById('annee');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

})();

/* ============================================================
   SECTION 11 — PANIER DE COMMANDE → WHATSAPP
   ------------------------------------------------------------
   État          : tableau d'objets
                   { id, nom, portion, prix_unitaire, quantite, image, desc }
                   (portion : 'entier' | 'demi' — vide pour les autres plats)
   Ajout        : boutons [data-add] de la carte (section #menu)
   Ouverture    : boutons [data-cart-open] (navbar + barre de carte)
   Finalisation : bouton #cart-checkout → wa.me avec message structuré
   Persistance  : localStorage (le panier survit au rechargement)
   Vanilla JS — aucune dépendance. Fait pour cohabiter avec le
   script principal ci-dessus (IIFE distincte, champs isolés).
   ============================================================ */
(function () {
  var STORAGE_KEY = 'op-panier-v1';

  /* ---------- Raccourcis DOM ---------- */
  var cartRoot = document.getElementById('panier');
  if (!cartRoot) return; // garde-fou : la modale n'est pas dans la page

  var listEl      = document.getElementById('cart-list');
  var emptyEl     = document.getElementById('cart-empty');
  var itemsCard   = listEl ? listEl.closest('.cart-card') : null;
  var notesEl     = document.getElementById('cart-notes');
  var subtotalEl  = document.getElementById('cart-subtotal');
  var totalEl     = document.getElementById('cart-total');
  var checkoutBtn = document.getElementById('cart-checkout');
  var clearBtn    = document.getElementById('cart-clear');
  var titleCount  = document.getElementById('cart-title-count');
  var toastEl     = document.getElementById('cart-toast');
  var toastText   = document.getElementById('cart-toast-text');
  var liveEl      = document.getElementById('cart-live');
  var closeBtn    = cartRoot.querySelector('.cart__close');
  var badgeEls    = document.querySelectorAll('[data-cart-badge]');

  /* Catalogue construit depuis les boutons [data-add] : source de vérité
     pour les noms, prix et images — permet de valider/salubriser tout
     panier restauré (localStorage modifiable à la main). */
  var CATALOG = {};
  document.querySelectorAll('[data-add]').forEach(function (btn) {
    var base = btn.getAttribute('data-add');
    if (!base || CATALOG[base]) return;
    CATALOG[base] = {
      nom: btn.getAttribute('data-nom') || '',
      prix: parseInt(btn.getAttribute('data-prix'), 10) || 0,
      image: btn.getAttribute('data-img') || '',
      desc: btn.getAttribute('data-desc') || ''
    };
  });

  /* ============================================================
     TARIFICATION POULET — portion (Entier / Demi) + promo du Mardi
     Grille stricte, valable pour « Poulet tracé » ET « Poulet
     sauté ou grillé » :
       entier : 5 000 F les jours normaux  →  4 000 F le mardi
       demi   : 2 500 F les jours normaux  →  2 000 F le mardi
     Le jour est évalué au moment de chaque usage (aucun état figé),
     côté client — l'heure locale du visiteur fait foi.
     ============================================================ */
  var GRILLE_POULET = {
    entier: { label: 'Entier', normal: 5000, mardi: 4000 },
    demi: { label: 'Demi', normal: 2500, mardi: 2000 }
  };
  function estMardi() {
    return new Date().getDay() === 2;
  }
  function prixPoulet(portion) {
    var g = GRILLE_POULET[portion === 'demi' ? 'demi' : 'entier'];
    return estMardi() ? g.mardi : g.normal;
  }
  function nomAffiche(item) {
    var g = item.portion ? GRILLE_POULET[item.portion] : null;
    return item.nom + (g ? ' (' + g.label + ')' : '');
  }

  /* Met à jour les prix des cartes à sélecteur de portion :
     - prix de la portion choisie (change instantanément) ;
     - le mardi : ancien prix barré + prix promo + badge. */
  function majPrixDOM() {
    var cards = document.querySelectorAll('.menu-item__card');
    var mardi = estMardi();
    cards.forEach(function (card) {
      var toggle = card.querySelector('[data-portion]');
      var priceEl = card.querySelector('.menu-item__price');
      if (!toggle || !priceEl) return;
      var actif = toggle.querySelector('.portion-toggle__btn.is-active');
      var portion = actif ? actif.getAttribute('data-value') : 'entier';
      var g = GRILLE_POULET[portion === 'demi' ? 'demi' : 'entier'];
      if (mardi) {
        priceEl.className = 'menu-item__price is-promo';
        priceEl.innerHTML =
          '<span class="menu-item__price-line">' +
          '<del>' + money(g.normal) + '</del> ' +
          '<strong>' + money(g.mardi) + '</strong> F\u00a0CFA' +
          '</span>' +
          '<span class="promo-badge">Promo du Mardi\u00a0!</span>';
      } else {
        priceEl.className = 'menu-item__price';
        priceEl.innerHTML =
          '<strong>' + money(g.normal) + '</strong> F\u00a0CFA';
      }
    });
  }

  /* ---------- État ---------- */
  var cart = [];          // [{ id, nom, portion, prix_unitaire, quantite, image, desc }]
  var toastTimer = null;
  var lastFocused = null; // élément déclencheur, pour rendre le focus à la fermeture

  /* ---------- Utilitaires ---------- */

  /* 16000 → « 16 000 » ; plainSpace = espace simple (WhatsApp) sinon insécable (écran) */
  function money(n, plainSpace) {
    return String(Math.max(0, Math.round(n)))
      .replace(/\B(?=(\d{3})+(?!\d))/g, plainSpace ? ' ' : '\u00a0');
  }
  function itemCount() {
    return cart.reduce(function (s, i) { return s + i.quantite; }, 0);
  }
  function subtotal() {
    return cart.reduce(function (s, i) { return s + i.prix_unitaire * i.quantite; }, 0);
  }
  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); }
    catch (e) { /* stockage indisponible : le panier vit simplement en mémoire */ }
  }

  /* Portion déduite d'un id composé (« poulet-trace--entier ») ou du champ portion */
  function portionOf(id, stored) {
    if (typeof id !== 'string') return '';
    if (id.slice(-8) === '--entier') return 'entier';
    if (id.slice(-6) === '--demi') return 'demi';
    return stored === 'entier' || stored === 'demi' ? stored : '';
  }

  /* Prix de référence d'une ligne : grille poulet (jour courant) ou
     catalogue « data-* » — jamais le prix figé du localStorage. */
  function prixDeReference(portion, base) {
    if (portion && GRILLE_POULET[portion]) return prixPoulet(portion);
    var cat = CATALOG[base];
    return cat ? cat.prix : null;
  }

  /* Restaure SANS faire confiance au contenu brut : mauvais JSON, ids
     inconnus, quantités ou prix hors bornes, doublons → nettoyés. */
  function restore() {
    var hadStored = false;
    var raw = null;
    try {
      var text = localStorage.getItem(STORAGE_KEY);
      hadStored = typeof text === 'string';
      raw = JSON.parse(text);
    } catch (e) { raw = null; }
    if (!Array.isArray(raw)) { cart = []; return; }

    var merged = Object.create(null);
    raw.forEach(function (entry) {
      if (!entry || typeof entry !== 'object') return;
      var id = typeof entry.id === 'string' ? entry.id.trim() : '';
      if (!id) return;
      var base = id.split('--')[0];
      var portion = portionOf(id, entry.portion);

      /* Hors catalogue et hors grille poulet : donnée inconnue → rejetée */
      if (portion && !GRILLE_POULET[portion]) return;
      if (!portion && !CATALOG[base]) return;
      var cat = CATALOG[base] || null;

      var nom = (cat && cat.nom) || (typeof entry.nom === 'string' ? entry.nom.trim().slice(0, 120) : '');
      if (!nom) return;

      var prix = prixDeReference(portion, base);
      if (prix === null || !isFinite(prix) || prix < 0) return;

      var q = parseInt(entry.quantite, 10);
      if (!isFinite(q) || q < 1) q = 1;
      q = Math.min(q, 99);

      var image = cat && cat.image ? cat.image : '';
      var desc = (cat && cat.desc) || (typeof entry.desc === 'string' ? entry.desc.slice(0, 160) : '');

      if (merged[id]) {
        merged[id].quantite = Math.min(merged[id].quantite + q, 99);
      } else {
        merged[id] = {
          id: id,
          nom: nom,
          portion: portion,
          prix_unitaire: prix,
          quantite: q,
          image: image,
          desc: desc
        };
      }
    });

    cart = Object.keys(merged).map(function (k) { return merged[k]; });
    /* Réécrit le stockage avec des données sûres (nettoie les ordures) */
    if (hadStored) persist();
  }

  /* Re-calibre les prix du panier (changement de jour : la promo du
     mardi ne doit JAMAIS persister mercredi). Re-rend seulement si un
     prix a réellement changé. */
  function majPrixCart() {
    var changed = false;
    cart.forEach(function (item) {
      var prix = prixDeReference(item.portion, item.id.split('--')[0]);
      if (prix !== null && prix !== item.prix_unitaire) {
        item.prix_unitaire = prix;
        changed = true;
      }
    });
    if (changed) { persist(); renderCart(); }
  }

  /* Jour change pendant que l'onglet reste ouvert : recalage au retour
     sur l'onglet (visibility) et à la prise de focus de la fenêtre. */
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      majPrixDOM();
      majPrixCart();
    }
  });
  window.addEventListener('focus', function () {
    majPrixDOM();
    majPrixCart();
  });
  function showToast(text) {
    if (!toastEl) return;
    toastText.textContent = text;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('is-visible');
    }, 2600);
  }
  function pulseBadges() {
    badgeEls.forEach(function (b) {
      b.classList.remove('is-bump');
      void b.offsetWidth; /* force le reflow pour rejouer l'animation */
      b.classList.add('is-bump');
    });
  }

  /* ============================================================
     CŒUR DU PANIER (API demandée)
     ============================================================ */

  /* Ajoute un plat — ou incrémente sa quantité s'il existe déjà. */
  function addToCart(item) {
    var found = null;
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].id === item.id) { found = cart[i]; break; }
    }
    if (found) {
      found.quantite += 1;
      showToast(nomAffiche(found) + ' : ' + found.quantite + ' dans le panier');
    } else {
      cart.push({
        id: item.id,
        nom: item.nom,
        portion: item.portion || '',
        prix_unitaire: item.prix_unitaire,
        quantite: 1,
        image: item.image || '',
        desc: item.desc || ''
      });
      showToast(nomAffiche(item) + ' ajouté au panier');
    }
    persist();
    renderCart();
    pulseBadges();
  }

  /* Gère les clics sur [+] et [−] ; à 1, [−] retire la ligne. */
  function updateQuantity(id, action) {
    var item = find(id);
    if (!item) return;
    if (action === 'plus') {
      item.quantite = Math.min(item.quantite + 1, 99);
    } else {
      item.quantite -= 1;
      if (item.quantite <= 0) { removeFromCart(id); return; }
    }
    persist();
    renderCart();
  }

  /* Supprime complètement un plat du panier. */
  function removeFromCart(id) {
    var removed = null;
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].id === id) { removed = cart[i]; cart.splice(i, 1); break; }
    }
    if (removed) {
      persist();
      renderCart();
      showToast(removed.nom + ' retiré du panier');
    }
  }

  /* Vide tout le panier (après confirmation native). */
  function clearCart() {
    if (cart.length === 0) return;
    if (window.confirm('Vider le panier ?')) {
      cart = [];
      persist();
      renderCart();
      showToast('Panier vidé');
    }
  }

  /* ---------- Aides internes ---------- */
  function find(id) {
    for (var i = 0; i < cart.length; i++) if (cart[i].id === id) return cart[i];
    return null;
  }

  /* ---------- Rendu du DOM ---------- */

  /* Repeint la liste + les totaux à chaque modification de l'état.
     Si le focus était sur un bouton de la liste, il est replacé après
     reconstruction (l'utilisateur au clavier ne perd jamais sa place). */
  function renderCart() {
    var refocus = null;
    var ae = document.activeElement;
    if (ae && listEl.contains(ae)) {
      var rid = ae.getAttribute('data-id');
      var ract = ae.getAttribute('data-qty');
      if (rid) {
        refocus = ract
          ? '.cart-qty__btn[data-qty="' + ract + '"][data-id="' + rid + '"]'
          : '.cart-row__trash[data-id="' + rid + '"]';
      }
    }

    listEl.textContent = '';

    cart.forEach(function (item) {
      var li = document.createElement('li');
      li.className = 'cart-row';
      li.setAttribute('data-id', item.id);

      /* Miniature : photo du plat, ou vignette laiton en repli */
      var media = document.createElement('div');
      media.className = 'cart-row__media';
      if (item.image) {
        var img = document.createElement('img');
        img.className = 'cart-row__img';
        img.src = item.image;
        img.alt = nomAffiche(item);
        img.loading = 'lazy';
        img.decoding = 'async';
        media.appendChild(img);
      } else {
        var ph = document.createElement('span');
        ph.className = 'cart-row__ph';
        ph.innerHTML =
          '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-flame"/></svg>';
        media.appendChild(ph);
      }
      li.appendChild(media);

      /* Nom, variante, prix unitaire */
      var meta = document.createElement('div');
      meta.className = 'cart-row__meta';
      var name = document.createElement('h4');
      name.className = 'cart-row__name';
      name.textContent = nomAffiche(item);
      meta.appendChild(name);
      if (item.desc) {
        var variant = document.createElement('p');
        variant.className = 'cart-row__variant';
        variant.textContent = item.desc;
        meta.appendChild(variant);
      }
      var unit = document.createElement('span');
      unit.className = 'cart-row__unit';
      unit.textContent = money(item.prix_unitaire) + '\u00a0F / unité';
      meta.appendChild(unit);
      li.appendChild(meta);

      /* Sélecteur de quantité en pilule */
      var qty = document.createElement('div');
      qty.className = 'cart-qty';
      qty.setAttribute('role', 'group');
      qty.setAttribute('aria-label', 'Quantité de ' + nomAffiche(item));
      var minus = document.createElement('button');
      minus.type = 'button';
      minus.className = 'cart-qty__btn';
      minus.setAttribute('data-qty', 'minus');
      minus.setAttribute('data-id', item.id);
      minus.setAttribute('aria-label', 'Réduire la quantité de ' + nomAffiche(item));
      minus.textContent = '\u2212';
      var value = document.createElement('span');
      value.className = 'cart-qty__value';
      value.textContent = String(item.quantite);
      var plus = document.createElement('button');
      plus.type = 'button';
      plus.className = 'cart-qty__btn';
      plus.setAttribute('data-qty', 'plus');
      plus.setAttribute('data-id', item.id);
      plus.setAttribute('aria-label', 'Augmenter la quantité de ' + nomAffiche(item));
      plus.textContent = '+';
      qty.appendChild(minus);
      qty.appendChild(value);
      qty.appendChild(plus);
      li.appendChild(qty);

      /* Total de la ligne */
      var lineTotal = document.createElement('strong');
      lineTotal.className = 'cart-row__total';
      lineTotal.textContent = money(item.prix_unitaire * item.quantite) + '\u00a0F';
      li.appendChild(lineTotal);

      /* Corbeille */
      var trash = document.createElement('button');
      trash.type = 'button';
      trash.className = 'cart-row__trash';
      trash.setAttribute('data-remove', '');
      trash.setAttribute('data-id', item.id);
      trash.setAttribute('aria-label', 'Supprimer ' + nomAffiche(item) + ' du panier');
      trash.innerHTML =
        '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-bin"/></svg>';
      li.appendChild(trash);

      listEl.appendChild(li);
    });

    /* Synthèse + états liés */
    var n = itemCount();
    var st = subtotal();
    emptyEl.hidden = n > 0;
    if (itemsCard) itemsCard.classList.toggle('is-empty', n === 0);
    checkoutBtn.disabled = n === 0;
    clearBtn.disabled = n === 0;
    titleCount.textContent = n === 0 ? '0 article' : (n === 1 ? '1 article' : n + ' articles');
    subtotalEl.textContent = money(st) + '\u00a0F';
    /* Livraison « à convenir » → total affiché = sous-total (hors livraison) */
    totalEl.textContent = money(st) + '\u00a0F';
    badgeEls.forEach(function (b) {
      b.textContent = String(n);
      b.hidden = n === 0;
    });

    /* Le libellé de chaque bouton reflète l'état réel, même après rechargement. */
    document.querySelectorAll('[data-add]').forEach(function (button) {
      var card = button.closest('.menu-item__card');
      var portionToggle = card ? card.querySelector('[data-portion]') : null;
      var activePortion = portionToggle
        ? portionToggle.querySelector('.portion-toggle__btn.is-active')
        : null;
      var portion = activePortion ? activePortion.getAttribute('data-value') : '';
      var id = button.getAttribute('data-add') + (portion ? '--' + portion : '');
      var inCart = !!find(id);
      button.classList.toggle('is-added', inCart);
      var label = button.querySelector('span');
      if (label) label.textContent = inCart ? 'Retirer' : 'Ajouter';
    });

    /* Annonce accessible (hors modale, toujours à l'écoute) */
    if (liveEl) {
      liveEl.textContent =
        n === 0
          ? 'Panier vide.'
          : 'Panier : ' +
            (n === 1 ? '1 article' : n + ' articles') +
            ', sous-total ' + money(st, true) + ' FCFA.';
    }

    if (refocus) {
      var again = listEl.querySelector(refocus);
      if (again) again.focus();
    }
  }

  /* ============================================================
     GÉNÉRATION DE LA COMMANDE WHATSAPP
     ============================================================ */
  function buildWhatsAppMessage() {
    var lines = ["Bonjour O'Poulet Tracé Plus ! Je souhaite commander :"];
    cart.forEach(function (item) {
      lines.push(
        '- ' + item.quantite + 'x ' +
        (item.portion === 'demi' ? 'Demi-' : '') + item.nom +
        ' (' + money(item.prix_unitaire * item.quantite, true) + ' FCFA)'
      );
    });
    var notes = (notesEl && notesEl.value.trim()) || '\u2014';
    lines.push('Précisions : ' + notes);
    lines.push('Total de la commande : ' + money(subtotal(), true) + ' FCFA (hors livraison)');
    return lines.join('\n');
  }

  function sendWhatsAppOrder() {
    if (cart.length === 0) return;
    /* Jour vérifié juste avant l'envoi : prix recalés si le jour a changé */
    majPrixDOM();
    majPrixCart();
    opWaOpen(opWaUrl(buildWhatsAppMessage()));
    checkoutBtn.classList.add('is-sent');
    setTimeout(function () { checkoutBtn.classList.remove('is-sent'); }, 600);
    showToast('Commande prête : finalisez sur WhatsApp');
  }

  /* ============================================================
     MODALE — ouverture, fermeture, focus, Échap
     ============================================================ */
  function cartIsOpen() { return cartRoot.classList.contains('is-open'); }

  /* Fond rendu inerte quand la modale est ouverte (tab + lecteurs d'écran) */
  var BACKGROUND_SELECTORS = ['.skip-link', '#navbar', 'main', 'footer', '.wa-fab'];
  function setBackgroundInert(on) {
    BACKGROUND_SELECTORS.forEach(function (sel) {
      var el = document.querySelector(sel);
      if (!el) return;
      if (on && 'inert' in el) el.setAttribute('inert', '');
      else el.removeAttribute('inert');
    });
  }

  /* Référence le volet mobile s'il était ouvert (on le referme) */
  function closeMobileNav() {
    var nav = document.getElementById('nav-menu');
    var burger = document.getElementById('nav-burger');
    if (nav && nav.classList.contains('is-open')) {
      nav.classList.remove('is-open');
      if (burger) {
        burger.setAttribute('aria-expanded', 'false');
        burger.setAttribute('aria-label', 'Ouvrir le menu de navigation');
      }
    }
  }

  /* Piège de focus : Tab reste à l'intérieur de la modale */
  var FOCUSABLE_SEL =
    'a[href], button:not([disabled]), textarea:not([disabled]), ' +
    'input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function trapTab(e) {
    if (!cartIsOpen() || e.key !== 'Tab') return;
    var focusables = Array.prototype.filter.call(
      cartRoot.querySelectorAll(FOCUSABLE_SEL),
      function (el) { return el.offsetParent !== null; }
    );
    if (focusables.length === 0) return;
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    var active = document.activeElement;
    if (!cartRoot.contains(active)) {
      e.preventDefault();
      first.focus();
    } else if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }
  document.addEventListener('keydown', trapTab);

  function openCart() {
    if (cartIsOpen()) return;
    lastFocused = document.activeElement;

    /* Le toast ne recouvre jamais le résumé de commande */
    if (toastEl) {
      toastEl.classList.remove('is-visible');
      clearTimeout(toastTimer);
      toastTimer = null;
    }

    closeMobileNav();
    document.body.classList.add('cart-is-open');
    cartRoot.classList.add('is-open');
    cartRoot.setAttribute('aria-hidden', 'false');
    setBackgroundInert(true);
    if (closeBtn) closeBtn.focus();
  }

  function closeCart() {
    if (!cartIsOpen()) return;
    cartRoot.classList.remove('is-open');
    cartRoot.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('cart-is-open');
    setBackgroundInert(false);
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    lastFocused = null;
  }

  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Escape' || e.key === 'Esc') && cartIsOpen()) closeCart();
  });

  /* ============================================================
     DÉLÉGATION UNIQUE — un seul listener pour toute l'interface
     (survit au re-rendu des lignes : jamais de rebinding)
     ============================================================ */
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;

    /* Toggle de portion (Entier / Demi) des cartes poulet :
       un clic sélectionne la portion et rafraîchit le prix affiché */
    var pBtn = t.closest('.portion-toggle__btn');
    if (pBtn) {
      var wrap = pBtn.closest('[data-portion]');
      if (wrap) {
        wrap.querySelectorAll('.portion-toggle__btn').forEach(function (b) {
          var on = b === pBtn;
          b.classList.toggle('is-active', on);
          b.setAttribute('aria-pressed', String(on));
        });
        majPrixDOM();
      }
      return;
    }

    /* Un clic ajoute le plat ; un second clic le retire.
       La quantité se modifie uniquement dans le panier. */
    var addBtn = t.closest('[data-add]');
    if (addBtn) {
      var card = addBtn.closest('.menu-item__card');
      var portToggle = card ? card.querySelector('[data-portion]') : null;
      var activeBtn = portToggle
        ? portToggle.querySelector('.portion-toggle__btn.is-active')
        : null;
      var portion = activeBtn ? activeBtn.getAttribute('data-value') : '';
      var prixAjout = portToggle
        ? prixPoulet(portion || 'entier')
        : parseInt(addBtn.getAttribute('data-prix'), 10) || 0;
      var itemId = addBtn.getAttribute('data-add') + (portion ? '--' + portion : '');
      var existingItem = find(itemId);
      if (existingItem) {
        removeFromCart(itemId);
        addBtn.classList.remove('is-added');
        addBtn.querySelector('span').textContent = 'Ajouter';
        return;
      }

      addToCart({
        /* portion ≠ « » → id composé : Entier et Demi coexistent en
           2 lignes distinctes du panier (update/remove restent id-based) */
        id: itemId,
        nom: addBtn.getAttribute('data-nom'),
        portion: portion,
        prix_unitaire: prixAjout,
        image: addBtn.getAttribute('data-img') || '',
        desc: addBtn.getAttribute('data-desc') || ''
      });
      addBtn.classList.add('is-added');
      addBtn.querySelector('span').textContent = 'Retirer';
      return;
    }

    /* Pilule de quantité */
    var qtyBtn = t.closest('[data-qty]');
    if (qtyBtn) {
      updateQuantity(qtyBtn.getAttribute('data-id'), qtyBtn.getAttribute('data-qty'));
      return;
    }

    /* Corbeille */
    var rmBtn = t.closest('[data-remove]');
    if (rmBtn) {
      removeFromCart(rmBtn.getAttribute('data-id'));
      return;
    }

    /* Fermeture de la modale (voile, croix, « Continuer mes achats ») */
    if (t.closest('[data-cart-close]')) { closeCart(); return; }

    /* Ouverture (navbar + barre de carte) */
    if (t.closest('[data-cart-open]')) { openCart(); return; }

    /* Commande WhatsApp */
    if (t.closest('#cart-checkout')) { sendWhatsAppOrder(); return; }

    /* Vider le panier */
    if (t.closest('#cart-clear')) { clearCart(); return; }
  });

  /* ---------- Amorçage ---------- */
  restore();
  renderCart();
  majPrixDOM(); /* mardi → prix barré + badge « Promo » dans les 2 cartes poulet */
})();
/* ============================================================
   7) INDICATEUR DE DÉFILEMENT DU MENU (slider horizontal)
   Pastille « Glissez pour voir toute la carte » :
   - un clic avance d'une carte (largeur + gap) ;
   - masquée si le rail tient sans défilement (aucun débordement)
     ou dès que l'utilisateur a commencé à faire défiler ;
   - recalcul au redimensionnement et au changement d'onglet.
   ============================================================ */
(function () {
  var grid = document.querySelector('.menu__grid');
  var hint = document.querySelector('[data-menu-hint]');
  if (!grid || !hint) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function maj() {
    var debordement = grid.scrollWidth > grid.clientWidth + 8;
    var aDejaDefile = grid.scrollLeft > 40;
    /* pastille utile seulement s'il reste quelque chose à droite */
    hint.classList.toggle('is-hidden', !debordement || aDejaDefile);
    /* affordance du bord droit : le dégradé s'efface au bout du rail */
    var auBout = grid.scrollLeft + grid.clientWidth >= grid.scrollWidth - 8;
    grid.classList.toggle('is-end', !debordement || auBout);
  }

  /* rAF : au plus une mesure de layout par trame (scroll + resize) */
  var majEnCours = false;
  function majDifferer() {
    if (majEnCours) return;
    majEnCours = true;
    window.requestAnimationFrame(function () {
      majEnCours = false;
      maj();
    });
  }

  hint.addEventListener('click', function () {
    /* 1ʳᵉ carte VISIBLE : après un filtre d'onglet, le pas reste correct */
    var carte = grid.querySelector('.menu-item:not(.is-hidden)');
    /* pas = 1 carte + le gap réel du rail (1rem mobile, 1.5rem desktop) */
    var gapPx = parseFloat(window.getComputedStyle(grid).columnGap) || 16;
    var step = carte
      ? Math.round(carte.getBoundingClientRect().width + gapPx)
      : 240;
    grid.scrollBy({ left: step, behavior: reduce ? 'auto' : 'smooth' });
  });

  /* les onglets masquent/affichent des cartes : le rail peut tenir d'un
     coup — re-calcul légèrement différé le temps du re-affichage */
  document.addEventListener('click', function (e) {
    if (e.target && e.target.closest && e.target.closest('.menu__tabs .tab')) {
      setTimeout(maj, 80);
    }
  });

  grid.addEventListener('scroll', majDifferer, { passive: true });
  window.addEventListener('resize', majDifferer);
  maj();
})();
