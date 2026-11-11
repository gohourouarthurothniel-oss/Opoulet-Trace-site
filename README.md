# O'Poulet Tracé Plus (Chez Alain) — Site vitrine one-page

Site vitrine 100 % HTML / CSS / JavaScript natif (aucun framework), construit autour de
l'identité réelle du restaurant **O'Poulet Tracé Plus** à **Yamoussoukro (Côte d'Ivoire)**.
Ouvrez `index.html` dans un navigateur — ou hébergez le dossier complet sur n'importe quel
hébergeur statique (Netlify, Vercel, GitHub Pages, cPanel…).

## Structure du projet

```
index.html        Page unique (nav, hero, à propos, carte, galerie, contact, bandeau, footer)
style.css         Feuille de style v3 + overrides + navbar v4 (une seule passe, mobile-first)
script.js         Interactions vanilla : navbar, smooth scroll, apparitions, onglets (ARIA),
                  panier (stockage assaini + envoi WhatsApp), promo du mardi, slider carte,
                  boutons WhatsApp, diaporama hero, année du footer
assets/           Images & vidéo optimisées utilisées par le site
IMAGE ET INFO O POULET TRACE/   Dossier source du client (photos et infos originales,
                  NE PAS publier — sert de référence à la provenance des images).
                  `audit-backup-assets/` y conserve des copies intactes des 8 fichiers
                  lourds d'avant optimisation (7 photos + vidéo d'origine).
```

## Données réelles utilisées (fiche Google + carte officielle du restaurant)

- **Nom** : O'Poulet Tracé Plus — « Poulet Tracé chez Alain »
- **Adresse** : derrière la Nouvelle CNPS, quartier Thérèse, Yamoussoukro, Côte d'Ivoire
- **Spécialité** : le **poulet tracé** (braisé), plus poissons braisés, escargots, cabri et agouti
- **Horaires** : ouvert **24 h / 24, 7 jours / 7**
- **Note** : 4,1 / 5 · 94 avis Google · budget signalé 5 000–10 000 F CFA / personne
- **Téléphones (carte officielle)** : WhatsApp `07 08 31 81 18` (`wa.me/2250708318118`)
  et `07 77 05 67 93` (`wa.me/2250777056793`)
- **Slogan officiel** : « Le plaisir de toujours bien manger »

## Images & vidéo (dossier `assets/`)

Toutes les images proviennent du dossier source `IMAGE ET INFO O POULET TRACE`
: elles ont été **recadrées et optimisées** : les 7 photos de plats/ambiance
les plus lourdes ont été re-compressées lors de l'audit (grand côté ramené à
1600 px, qualité JPEG 82) de 2,2–2,8 Mo à **150–330 Ko par photo**, sans perte
visible. Les anciens fichiers intacts sont gardés dans
`IMAGE ET INFO O POULET TRACE/audit-backup-assets/`.

`video presentation.mp4` (41 s, portrait 720×1240, réencodé H.264 CRF 31 + AAC 96k,
faststart) est passé de 13,2 Mo à **4,5 Mo**.

| Fichier                                                                | Origine                                        | Usage                                            |
| ---------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------ |
| `logo.jpg`                                                             | logo officiel de la maison                     | Favicon + badge de la navbar                     |
| `hero-terrasse.jpg`                                                    | `Opoulet-trace-plus-1` (recadré)               | Hero — enseigne & terrasse                       |
| `hero-salle.jpg`                                                       | `Opoulet-trace-plus-2` (recadré)               | Hero — salon                                     |
| `about-salle.jpg`                                                      | `Opoulet-trace-plus-2` (recadré)               | À propos                                         |
| `POULET BRAISE.jpg`, `POISSON BRAISE.jpg`, `SOUPE POISSON.jpg`         | photos réelles (plats signature)               | Carte + galerie panoramique                      |
| `ESCARGOT SAUTE.jpg`, `AGOUTI.jpg`, `Ambiance.jpg`                     | photos réelles                                 | Galerie panoramique                              |
| `g-terrasse.jpg`, `g-cadre.jpg`                                        | photos réelles (terrasse, cadre)               | Galerie panoramique                              |
| `menu-card.jpg`                                                        | `MENU.jpg` (l'affiche officielle)              | Bandeau de la section carte                      |
| `video presentation.mp4`                                               | vidéo du salon filmée par le client            | Section « À propos » (ratio naturel 4/3 via CSS) |
| `wa-logo-green.png`                                                    | Logo WhatsApp officiel **fourni par le client** | Bouton flottant, CTA du bandeau, footer         |
| `wa-logo-white.png`                                                    | Variante blanche du même logo                  | Icône des boutons verts `wa.me`                  |

## Mises à jour importantes

| Quoi ?                           | Où ?                                                                                                                                                |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Numéros WhatsApp / téléphone** | `index.html` (liens `wa.me/225…` + `tel:+225…`) **et** `script.js` (constante `OP_PHONE_WA` + helpers `opWaUrl()` / `opWaOpen()` en tête de fichier : tout le site passe par eux, message encodé via `encodeURIComponent`)  |
| **Plat**                         | Section « Notre carte » de `index.html` : attribut `data-order="Nom du plat"` (remplit le message WhatsApp) + `assets/menu-card.jpg` pour l'affiche |
| **Menu affiche**                 | Remplacez `assets/menu-card.jpg` par la nouvelle affiche (garder le même nom)                                                                       |
| **Photos**                       | Remplacez les fichiers de `assets/` (mêmes noms)                                                                                                    |
| **Couleurs & typo**              | Bloc `:root` (section 1) en tête de `style.css`                                                                                                     |

## Notes

- **Logo WhatsApp** : l'AVIF fourni avait un damier semi-transparent « cuit » dans son
  fond (fausse transparence) ; seuls les pixels verts du logo ont été conservés, puis
  déclinés en deux PNG transparents (vert `#17A24E` et blanc). Les images s'affichent
  nettes à toutes les tailles : source 256 px, redimensionnée en CSS via `.wa-glyph`.
- **Prix** : l'affiche ne listant pas de prix, le site indique la fourchette Google
  (5 000–10 000 F CFA / personne) et invite à demander le prix au WhatsApp.
- **Avis** : deux citations réelles des avis Google figurent dans « À propos ».
- La carte Google Maps s'affiche via un **embed sans clé API** (requête « O'Poulet
  Tracé Plus derrière la Nouvelle CNPS Yamoussoukro ») ; le bouton « Ouvrir dans
  Google Maps » pointe vers la même recherche.
- **Accessibilité / no-JS** : un bloc `<noscript>` garde la navbar opaque et lisible
  et affiche le menu directement sur mobile sans JavaScript.
- **Audit 2026-11 (qualité, a11y, responsive, panier)** :
  - **Onglets de la carte** : motif ARIA complet (roving tabindex, flèches,
    Origine/Fin, `aria-labelledby` du panneau qui suit l'onglet actif).
  - **Modale panier** : piège de focus (Tab reste dedans, Échap ferme, focus
    rendu au déclencheur), fond rendu `inert` pendant l'ouverture.
  - **Restauration du panier assainie** : JSON corrompu, ids inconnus, doublons,
    quantités aberrantes et prix figés sont rejetés/recalculés depuis les
    attributs `data-*` — la **promo du mardi ne persiste jamais** au-delà du mardi.
  - **Annonce live** : `<p id="cart-live" class="sr-only" aria-live="polite">`
    vocalise le contenu du panier ; les badges sont `aria-hidden`.
  - **Z-index hiérarchisés** : navbar < bouton WhatsApp flottant < modale
    panier (180) ; le toast est **sous** la modale (170) et masqué par
    `.cart.is-open ~ .cart-toast`.
  - **Responsive recollé** : aucun débordement horizontal 320–1440 px, liens de
    nav sur une ligne (compactage 1024–1199 px), hero ≤ 62rem de ligne,
    grilles features 1/2/3 colonnes, rail carte en `scroll-snap` avec peek
    mobile et reset au filtre.
- **Galerie panoramique** : bandeau photo pleine largeur au masque incurvé
  (`clip-path: ellipse()`), défilement marquee infini (9 photos × 2), pause au
  survol et au focus ; courbure réglable via `--pano-curve-x/y`, hauteur 40 vh
  (mobile) / 60 vh (desktop).
- Sur la bannière de la façade figure aussi le service **JLK Livraison**
  (01 06 15 14 76 / 07 06 25 29 99) — non intégré au site car il s'agit du service
  partenaire affiché sur place ; à confirmer avant de l'ajouter.

## Responsive (mobile-first)

- Navbar 68 px (82 px ≥ 768 px, 62 px ≤ 380 px), panneau mobile scrollable,
  fond solide au scroll.
- Onglets de la carte : défilement horizontal, jamais cassés.
- Galerie : bandeau panoramique défilant (plus de grille statique).
- CTA pleine largeur ≤ 639 px.
