/* ESSAI : tasses dessinées sur la carte (page de test essai-tasses.html, pas utilisée par le vrai site).
   1. Une petite tasse en coupe à côté de chaque boisson.
   2. Un guide « Dans votre tasse » sous la carte : café ou matcha, du plus corsé au plus doux.
   Proportions indicatives, à valider avec le café. */
(function(){
  var COUL = {
    espresso: "#4A2A1A", crema: "#B97C45", allonge: "#6B4128", filtre: "#5B3420",
    lait: "#E6CFAD", mousse: "#FBF4E6", chocolat: "#6E3B24", tonic: "#E3EEF1",
    orange: "#EE9B3B", matcha: "#7FA046", vanille: "#F1DDA6", lavande: "#C7B2DE",
    rose: "#EDB7BE", fraise: "#DC5F6E", chai: "#C3915F", hojicha: "#9C6A45", the: "#C98A3A"
  };
  var NOMS = {
    espresso: ["Espresso", "Espresso"], crema: ["Crema", "Crema"], allonge: ["Espresso allongé", "Long espresso"],
    filtre: ["Café filtre", "Filter coffee"], lait: ["Lait vapeur", "Steamed milk"], mousse: ["Mousse de lait", "Milk foam"],
    chocolat: ["Chocolat", "Chocolate"], tonic: ["Tonic", "Tonic"], orange: ["Jus d'orange", "Orange juice"],
    matcha: ["Matcha", "Matcha"], vanille: ["Vanille", "Vanilla"], lavande: ["Lavande", "Lavender"], rose: ["Rose", "Rose"],
    fraise: ["Fraise", "Strawberry"], chai: ["Chai", "Chai"], hojicha: ["Hojicha", "Hojicha"], the: ["Thé", "Tea"],
    glace: ["Glaçons", "Ice"]
  };
  /* Récipients (viewBox 40 x 48) : intérieur (pour remplir), contour, poignée, fond (y), haut du liquide possible (y). */
  var POTS = {
    demi:   { inside: "M11 25h18v9a7 7 0 0 1-7 7h-4a7 7 0 0 1-7-7z", handle: "M29 28h2.5a3 3 0 0 1 0 6H28.5", saucer: "M6 43.5h28", bottom: 41, top: 25 },
    tasse:  { inside: "M6 16h26v13a12 12 0 0 1-12 12h-2a12 12 0 0 1-12-12z", handle: "M32 20h2.5a4.5 4.5 0 0 1 0 9H31", saucer: "M3 43.5h34", bottom: 41, top: 16 },
    petite: { inside: "M10 20h20l-1.6 21.5h-16.8z", bottom: 41.5, top: 20 },
    verre:  { inside: "M9 5h22l-2.2 38h-17.6z", bottom: 43, top: 5 },
    mug:    { inside: "M8 11h22v26a5 5 0 0 1-5 5h-12a5 5 0 0 1-5-5z", handle: "M30 16h3a5 5 0 0 1 0 10h-3", bottom: 42, top: 11 }
  };
  /* Recettes : récipient, couches du bas vers le haut [ingrédient, part de la hauteur], glaçons. */
  var R = {
    "Double espresso":    { pot: "demi",   c: [["espresso", .62], ["crema", .16]] },
    "Americano":          { pot: "mug",    c: [["allonge", .78], ["crema", .07]] },
    "Batch brew":         { pot: "mug",    c: [["filtre", .84]] },
    "Espresso macchiato": { pot: "demi",   c: [["espresso", .5], ["mousse", .3]] },
    "Cortado":            { pot: "petite", c: [["espresso", .45], ["lait", .4], ["mousse", .05]] },
    "Cappuccino":         { pot: "tasse",  c: [["espresso", .3], ["lait", .3], ["mousse", .3]] },
    "Flat white":         { pot: "tasse",  c: [["espresso", .35], ["lait", .52], ["mousse", .06]] },
    "Mocha":              { pot: "tasse",  c: [["chocolat", .22], ["espresso", .24], ["lait", .34], ["mousse", .12]] },
    "Latte":              { pot: "verre",  c: [["espresso", .2], ["lait", .62], ["mousse", .1]] },
    "Espresso Tonic":     { pot: "verre",  c: [["tonic", .64], ["espresso", .22]], ice: true },
    "Espresso Sunrise":   { pot: "verre",  c: [["orange", .58], ["espresso", .24]], ice: true },
    "Matcha latte":       { pot: "verre",  c: [["lait", .5], ["matcha", .34]] },
    "Matcha Vanille":     { pot: "verre",  c: [["vanille", .16], ["lait", .36], ["matcha", .32]] },
    "Matcha Lavande":     { pot: "verre",  c: [["lavande", .16], ["lait", .36], ["matcha", .32]] },
    "Matcha Rose":        { pot: "verre",  c: [["rose", .16], ["lait", .36], ["matcha", .32]] },
    "Matcha Fraise":      { pot: "verre",  c: [["fraise", .2], ["lait", .32], ["matcha", .32]] },
    "Chai latte":         { pot: "tasse",  c: [["chai", .66], ["mousse", .2]] },
    "Chocolat chaud":     { pot: "tasse",  c: [["chocolat", .72], ["mousse", .14]] },
    "Hojicha latte":      { pot: "tasse",  c: [["hojicha", .66], ["mousse", .2]] },
    "Thé chaud":          { pot: "mug",    c: [["the", .82]] },
    "Make it dirty":      { pot: "demi",   c: [["espresso", .62], ["crema", .14]] }
  };
  var GUIDES = {
    cafe:   ["Espresso macchiato", "Cortado", "Flat white", "Cappuccino", "Latte", "Mocha"],
    matcha: ["Matcha latte", "Matcha Vanille", "Matcha Lavande", "Matcha Rose", "Matcha Fraise"]
  };
  var en = function(){ return typeof LANG !== "undefined" && LANG === "en"; };
  var nom = function(k){ return NOMS[k][en() ? 1 : 0]; };
  var uid = 0;
  var NS = "http://www.w3.org/2000/svg";

  function svg(recette, grand){
    var p = POTS[recette.pot], id = "tasse-" + (++uid), h = p.bottom - p.top, y = p.bottom, s = "";
    recette.c.forEach(function(layer){
      var hh = layer[1] * h; y -= hh;
      s += '<rect class="ly ly-' + layer[0] + '" x="0" y="' + y.toFixed(2) + '" width="40" height="' + (hh + .4).toFixed(2) + '" fill="' + COUL[layer[0]] + '"/>';
      if (layer[0] === "mousse" && grand){                  // petites bulles dans la mousse
        for (var i = 0; i < 7; i++) s += '<circle cx="' + (10.5 + i * 3.2) + '" cy="' + (y + hh * (.3 + (i % 2) * .4)).toFixed(2) + '" r=".75" fill="#D9C29C"/>';
      }
    });
    if (recette.ice){                                       // glaçons
      [[13, 14, -8], [21, 9, 12], [16, 24, 6], [24, 20, -14]].forEach(function(c){
        s += '<rect x="' + c[0] + '" y="' + c[1] + '" width="6.5" height="6.5" rx="1.3" transform="rotate(' + c[2] + ' ' + (c[0] + 3.2) + ' ' + (c[1] + 3.2) + ')" fill="#fff" fill-opacity=".55" stroke="#fff" stroke-opacity=".9" stroke-width=".6"/>';
      });
    }
    var verre = recette.pot === "verre" || recette.pot === "petite";
    // Traits écrits directement dans le dessin : il peut ainsi devenir une simple image (voir decorer)
    var sw = grand ? 1.6 : 2, trait = ' fill="none" stroke="#274E72" stroke-linejoin="round" stroke-linecap="round" stroke-width="';
    var tr1 = trait + sw + '"', trv = trait + (verre ? (grand ? 1.3 : 1.7) : sw) + '"';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 48" aria-hidden="true" focusable="false" class="' + (grand ? "tasse-g" : "tasse-p") + '">' +
      '<defs><clipPath id="' + id + '"><path d="' + p.inside + '"/></clipPath></defs>' +
      (verre ? '<path d="' + p.inside + '" fill="#fff" fill-opacity=".55"/>' : "") +
      '<g clip-path="url(#' + id + ')">' + s + '</g>' +
      (p.handle ? '<path d="' + p.handle + '"' + tr1 + '/>' : "") +
      (p.saucer ? '<path d="' + p.saucer + '"' + tr1 + '/>' : "") +
      '<path d="' + p.inside + '"' + trv + '/>' +
      (verre ? '<path d="M' + (recette.pot === "verre" ? 12.6 : 13.2) + ' ' + (p.top + 4) + 'v' + (h * .55).toFixed(1) + '" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="1.4" stroke-linecap="round"/>' : "") +
      '</svg>';
  }

  /* 1. Petites tasses dans la carte */
  var index = {};
  function indexer(){
    index = {};
    (typeof SITE_DATA !== "undefined" && SITE_DATA.menu || []).forEach(function(cat){
      cat.items.forEach(function(i){ if (R[i.name]){ index[i.name] = i.name; if (i.name_en) index[i.name_en] = i.name; } });
    });
  }
  function decorer(){
    indexer();
    document.querySelectorAll("#menu li .name").forEach(function(n){
      if (n.querySelector(".mini")) return;
      var txt = (n.firstChild && n.firstChild.nodeType === 3 ? n.firstChild.nodeValue : "").trim(), cle = index[txt];
      if (!cle) return;
      var span = document.createElement("span");
      // Simple image plutôt que dessin vectoriel dans la page : le navigateur la dessine une fois, puis n'a plus à la refaire au défilement
      var img = new Image(22, 26); img.alt = ""; img.decoding = "async"; img.draggable = false;
      img.src = "data:image/svg+xml," + encodeURIComponent(svg(R[cle], false));
      span.className = "mini"; span.setAttribute("aria-hidden", "true"); span.appendChild(img);
      n.insertBefore(span, n.firstChild);
    });
  }

  /* 2. Guide « Dans votre tasse » */
  var onglet = "cafe";
  function guide(){
    var box = document.getElementById("guide-tasses");
    if (!box){
      box = document.createElement("div"); box.id = "guide-tasses"; box.className = "guide";
      var zone = document.getElementById("pour-zone"); zone.parentNode.insertBefore(box, zone.nextSibling);
    }
    var T = en()
      ? { k: "Know your cup", h: "What's in your cup?", s: "From the boldest to the mildest: same espresso, a different amount of milk.", cafe: "Coffee", matcha: "Matcha", fort: "bolder", doux: "milder", note: "Proportions for illustration." }
      : { k: "Bien choisir", h: "Dans votre tasse", s: "Du plus corsé au plus doux : le même espresso, plus ou moins de lait.", cafe: "Café", matcha: "Matcha", fort: "plus corsé", doux: "plus doux", note: "Proportions indicatives." };
    if (onglet === "matcha") T.s = en() ? "Our matcha, on its own or on a fruity, floral or vanilla base." : "Notre matcha, nature ou posé sur une base vanille, florale ou fruitée.";
    var html = '<div class="guide-top"><div><p class="kicker">' + T.k + '</p><h3>' + T.h + '</h3><p class="guide-sub">' + T.s + '</p></div>' +
      '<div class="onglets" role="tablist">' +
      ["cafe", "matcha"].map(function(o){ return '<button role="tab" type="button" data-o="' + o + '" aria-selected="' + (o === onglet) + '">' + T[o] + '</button>'; }).join("") +
      '</div></div><ol class="rangee" style="--n:' + GUIDES[onglet].length + '">';
    GUIDES[onglet].forEach(function(n, i){
      var r = R[n], item = null;
      SITE_DATA.menu.forEach(function(c){ c.items.forEach(function(x){ if (x.name === n) item = x; }); });
      var titre = item ? tr(item, "name") : n;
      var couches = r.c.slice().reverse().map(function(l){ return '<li><i style="background:' + COUL[l[0]] + '"></i>' + nom(l[0]) + '</li>'; }).join("") +
        (r.ice ? '<li><i class="ice"></i>' + nom("glace") + '</li>' : "");
      html += '<li class="carte-tasse" style="--d:' + (i * 70) + 'ms">' + svg(r, true) +
        '<b>' + titre + '</b>' + (item ? '<span class="px">CHF ' + item.price.toFixed(2) + '</span>' : "") +
        '<ul class="couches">' + couches + '</ul></li>';
    });
    html += '</ol>';
    if (onglet === "cafe") html += '<div class="echelle" aria-hidden="true"><span>' + T.fort + '</span><i></i><span>' + T.doux + '</span></div>';
    html += '<p class="guide-note">' + T.note + '</p>';
    box.innerHTML = html;
    box.querySelectorAll(".onglets button").forEach(function(b){
      b.addEventListener("click", function(){ onglet = b.getAttribute("data-o"); guide(); box.classList.add("vu"); });
    });
    if (!guide.io){
      guide.io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ box.classList.add("vu"); guide.io.disconnect(); } }); }, { threshold: .25 });
      guide.io.observe(box);
    }
  }

  function tout(){ decorer(); guide(); }
  window.addEventListener("menu-rendered", tout);
  tout();
})();
