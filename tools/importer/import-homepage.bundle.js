/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-homepage.js
  var import_homepage_exports = {};
  __export(import_homepage_exports, {
    default: () => import_homepage_default
  });

  // tools/importer/parsers/hero-billboard.js
  function parse(element, { document }) {
    const cells = [];
    const picture = element.querySelector("picture");
    const img = picture || element.querySelector("img");
    if (img) {
      const imageFrag = document.createDocumentFragment();
      imageFrag.appendChild(document.createComment(" field:image "));
      imageFrag.appendChild(img.cloneNode(true));
      cells.push([imageFrag]);
    }
    const contentRoot = element.querySelector(".hero-content") || element;
    const textFrag = document.createDocumentFragment();
    textFrag.appendChild(document.createComment(" field:text "));
    const heading = contentRoot.querySelector("h1, h2, h3");
    const paragraphs = Array.from(contentRoot.querySelectorAll("p"));
    let added = false;
    if (heading) {
      textFrag.appendChild(heading.cloneNode(true));
      added = true;
    }
    paragraphs.forEach((p) => {
      textFrag.appendChild(p.cloneNode(true));
      added = true;
    });
    if (added) cells.push([textFrag]);
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-billboard", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/hero-promo.js
  function parse2(element, { document }) {
    const cells = [];
    const picture = element.querySelector("picture");
    const img = picture || element.querySelector("img");
    if (img) {
      const imageFrag = document.createDocumentFragment();
      imageFrag.appendChild(document.createComment(" field:image "));
      imageFrag.appendChild(img.cloneNode(true));
      cells.push([imageFrag]);
    }
    const textFrag = document.createDocumentFragment();
    textFrag.appendChild(document.createComment(" field:text "));
    const heading = element.querySelector("h1, h2, h3, h4");
    const paragraphs = Array.from(element.querySelectorAll("p"));
    const ctaLinks = Array.from(element.querySelectorAll("a")).filter((a) => !paragraphs.some((p) => p.contains(a)));
    let added = false;
    if (heading) {
      textFrag.appendChild(heading.cloneNode(true));
      added = true;
    }
    paragraphs.forEach((p) => {
      textFrag.appendChild(p.cloneNode(true));
      added = true;
    });
    ctaLinks.forEach((a) => {
      const p = document.createElement("p");
      const link = document.createElement("a");
      link.setAttribute("href", a.getAttribute("href"));
      link.textContent = a.textContent.trim();
      p.appendChild(link);
      textFrag.appendChild(p);
      added = true;
    });
    if (added) cells.push([textFrag]);
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const isCta = element.classList.contains("cta-teaser");
    const name = isCta ? "hero-promo (cta)" : "hero-promo";
    const block = WebImporter.Blocks.createBlock(document, { name, cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-feature.js
  function parse3(element, { document }) {
    const cells = [];
    let cardRoots = Array.from(element.querySelectorAll(":scope > .card"));
    if (cardRoots.length === 0) {
      cardRoots = Array.from(element.querySelectorAll(":scope > li, :scope > div, :scope > a"));
    }
    cardRoots.forEach((root) => {
      const picture = root.querySelector("picture");
      const img = picture || root.querySelector("img");
      const imageFrag = document.createDocumentFragment();
      if (img) {
        imageFrag.appendChild(document.createComment(" field:image "));
        imageFrag.appendChild(img.cloneNode(true));
      }
      const textFrag = document.createDocumentFragment();
      textFrag.appendChild(document.createComment(" field:text "));
      const textParts = Array.from(root.children).filter((c) => {
        if (c === picture) return false;
        return c.tagName !== "PICTURE" && c.tagName !== "IMG";
      });
      textParts.forEach((n) => textFrag.appendChild(n.cloneNode(true)));
      cells.push([imageFrag, textFrag]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-feature", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-announce.js
  function parse4(element, { document }) {
    const cells = [];
    let cardRoots = Array.from(element.querySelectorAll(":scope > .card, :scope > li, :scope > div.card"));
    if (cardRoots.length === 0) {
      cardRoots = [element];
    }
    cardRoots.forEach((root) => {
      const picture = root.querySelector("picture");
      const img = picture || root.querySelector("img");
      const imageFrag = document.createDocumentFragment();
      if (img) {
        imageFrag.appendChild(document.createComment(" field:image "));
        imageFrag.appendChild(img.cloneNode(true));
      }
      const textFrag = document.createDocumentFragment();
      textFrag.appendChild(document.createComment(" field:text "));
      const textNodes = Array.from(root.children).filter((c) => {
        if (c === picture) return false;
        if (c.tagName === "PICTURE" || c.tagName === "IMG") return false;
        return true;
      });
      textNodes.forEach((n) => textFrag.appendChild(n.cloneNode(true)));
      cells.push([imageFrag, textFrag]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-announce", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-product.js
  function parse5(element, { document }) {
    const cells = [];
    let cardRoots = Array.from(element.querySelectorAll("a")).filter((a) => !a.parentElement.closest("a"));
    if (cardRoots.length === 0) {
      cardRoots = Array.from(element.querySelectorAll(":scope > .card, :scope > li, :scope > div"));
    }
    cardRoots.forEach((root) => {
      var _a, _b;
      const href = root.tagName === "A" ? root.getAttribute("href") : (_b = (_a = root.querySelector("a") || {}).getAttribute) == null ? void 0 : _b.call(_a, "href");
      const picture = root.querySelector("picture");
      const img = picture || root.querySelector("img");
      const imageFrag = document.createDocumentFragment();
      if (img) {
        imageFrag.appendChild(document.createComment(" field:image "));
        imageFrag.appendChild(img.cloneNode(true));
      }
      const textFrag = document.createDocumentFragment();
      textFrag.appendChild(document.createComment(" field:text "));
      const heading = root.querySelector("h1, h2, h3, h4, h5, h6");
      const titleText = (heading ? heading.textContent : (root.querySelector(".title") || {}).textContent || "").trim();
      const h = document.createElement("h3");
      if (href && titleText) {
        const a = document.createElement("a");
        a.setAttribute("href", href);
        a.textContent = titleText;
        h.appendChild(a);
      } else {
        h.textContent = titleText;
      }
      if (titleText) textFrag.appendChild(h);
      root.querySelectorAll("p").forEach((p) => {
        const t = p.textContent.trim();
        if (!t) return;
        const np = document.createElement("p");
        np.textContent = t;
        textFrag.appendChild(np);
      });
      cells.push([imageFrag, textFrag]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-product", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-editorial.js
  function parse6(element, { document }) {
    const cells = [];
    let cardRoots = Array.from(element.querySelectorAll("a")).filter((a) => !a.parentElement.closest("a"));
    if (cardRoots.length === 0) {
      cardRoots = Array.from(element.querySelectorAll(":scope > .card, :scope > li, :scope > div"));
    }
    cardRoots.forEach((root) => {
      var _a, _b;
      const href = root.tagName === "A" ? root.getAttribute("href") : (_b = (_a = root.querySelector("a") || {}).getAttribute) == null ? void 0 : _b.call(_a, "href");
      const picture = root.querySelector("picture");
      const img = picture || root.querySelector("img");
      const imageFrag = document.createDocumentFragment();
      if (img) {
        imageFrag.appendChild(document.createComment(" field:image "));
        imageFrag.appendChild(img.cloneNode(true));
      }
      const textFrag = document.createDocumentFragment();
      textFrag.appendChild(document.createComment(" field:text "));
      const isAffordance = (t) => /^read\b/i.test(t) || /^see\b/i.test(t);
      const leaves = [];
      const seen = /* @__PURE__ */ new Set();
      const labelEl = root.querySelector(".label");
      const heading = root.querySelector("h1, h2, h3, h4, h5, h6");
      if (heading) {
        const titleText = heading.textContent.trim();
        let labelText = labelEl ? labelEl.textContent.trim() : "";
        if (!labelText) {
          const cand = Array.from(root.querySelectorAll("div, span, p")).find((n) => {
            const t = n.textContent.trim();
            return t && t !== titleText && !isAffordance(t) && !n.querySelector("*") && heading.compareDocumentPosition(n) & Node.DOCUMENT_POSITION_PRECEDING;
          });
          if (cand) labelText = cand.textContent.trim();
        }
        if (labelText) {
          leaves.push({ cls: "label", text: labelText });
        }
        leaves.push({ cls: "", text: titleText, link: true });
      } else {
        const labelText = labelEl ? labelEl.textContent.trim() : "";
        if (labelText) {
          leaves.push({ cls: "label", text: labelText });
          seen.add(labelText);
        }
        const p = Array.from(root.querySelectorAll("p")).find((n) => {
          const t = n.textContent.trim();
          return t && !seen.has(t) && !isAffordance(t);
        });
        if (p) leaves.push({ cls: "", text: p.textContent.trim(), link: true });
      }
      leaves.forEach((leaf) => {
        const p = document.createElement("p");
        if (leaf.cls) p.className = leaf.cls;
        if (leaf.link && href) {
          const a = document.createElement("a");
          a.setAttribute("href", href);
          a.textContent = leaf.text;
          p.appendChild(a);
        } else {
          p.textContent = leaf.text;
        }
        textFrag.appendChild(p);
      });
      cells.push([imageFrag, textFrag]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-editorial", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-calc.js
  function parse7(element, { document }) {
    const cells = [];
    let cardRoots = Array.from(element.querySelectorAll(":scope > a"));
    if (cardRoots.length === 0) {
      cardRoots = Array.from(element.querySelectorAll(":scope > .card, :scope > li, :scope > div"));
    }
    cardRoots.forEach((root) => {
      const href = root.tagName === "A" ? root.getAttribute("href") : (root.querySelector("a") || {}).href;
      const img = root.querySelector("img");
      const imageFrag = document.createDocumentFragment();
      if (img) {
        imageFrag.appendChild(document.createComment(" field:image "));
        imageFrag.appendChild(img.cloneNode(true));
      }
      const label = root.querySelector("p, span, h3, h4") || root;
      const textFrag = document.createDocumentFragment();
      textFrag.appendChild(document.createComment(" field:text "));
      if (href) {
        const a = document.createElement("a");
        a.setAttribute("href", href);
        a.textContent = label.textContent.trim();
        const p = document.createElement("p");
        p.appendChild(a);
        textFrag.appendChild(p);
      } else {
        const p = document.createElement("p");
        p.textContent = label.textContent.trim();
        textFrag.appendChild(p);
      }
      cells.push([imageFrag, textFrag]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-calc", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-stats.js
  function parse8(element, { document }) {
    let statDivs = Array.from(element.querySelectorAll(":scope > div"));
    if (statDivs.length === 0) {
      statDivs = Array.from(element.querySelectorAll(":scope > li, :scope > .stat, :scope > .column"));
    }
    const row = statDivs.map((div) => {
      const cell = [];
      Array.from(div.childNodes).forEach((n) => cell.push(n.cloneNode(true)));
      return cell;
    });
    if (row.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [row];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-stats", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/newyorklife-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        "#onetrust-consent-sdk",
        "#onetrust-banner-sdk",
        '[class*="cookie"]',
        '[id*="cookie"]'
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "header",
        "footer",
        "nav",
        // breadcrumb <nav aria-label="Breadcrumb"> in article-header
        ".breadcrumb",
        '[aria-label="Breadcrumb"]'
      ]);
      WebImporter.DOMUtils.remove(element, [
        ".share-bar"
      ]);
      WebImporter.DOMUtils.remove(element, [
        "iframe",
        "link",
        "noscript",
        "source",
        "script",
        "style"
      ]);
      element.querySelectorAll("*").forEach((el) => {
        el.removeAttribute("onclick");
        el.removeAttribute("data-track");
        el.removeAttribute("data-tracking");
        el.removeAttribute("data-analytics");
      });
    }
  }

  // tools/importer/transformers/newyorklife-sections.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform2(hookName, element, payload) {
    if (hookName !== TransformHook2.beforeTransform) return;
    const doc = element.ownerDocument;
    const template = payload && payload.template;
    const styled = {};
    const templateSections = template && Array.isArray(template.sections) ? template.sections : [];
    templateSections.forEach((s) => {
      if (s && s.name && s.style) styled[s.name] = s.style;
    });
    const sectionEls = Array.from(
      element.querySelectorAll("[data-section], [data-block]")
    ).filter((el) => {
      const parentSection = el.parentElement && el.parentElement.closest("[data-section], [data-block]");
      return !parentSection;
    });
    if (sectionEls.length < 2) return;
    sectionEls.forEach((sectionEl, i) => {
      if (i > 0) {
        sectionEl.before(doc.createElement("hr"));
      }
      const name = sectionEl.getAttribute("data-section") || sectionEl.getAttribute("data-block");
      const style = styled[name];
      if (style) {
        const metaBlock = WebImporter.Blocks.createBlock(doc, {
          name: "Section Metadata",
          cells: { style }
        });
        sectionEl.append(metaBlock);
      }
    });
  }

  // tools/importer/transformers/newyorklife-dm-images.js
  function detectDynamicMediaUrl(urlStr) {
    let u;
    try {
      u = new URL(urlStr, "https://x/");
    } catch (e) {
      return false;
    }
    if (u.pathname.startsWith("/is/image/")) {
      return "scene7";
    }
    if (/^delivery-p\d+-e\d+\.adobeaemcloud\.com$/.test(u.hostname) && u.pathname.startsWith("/adobe/assets/urn:")) {
      return "dm-openapi";
    }
    return false;
  }
  var LINKED_DM_INLINE_WRAPPER_TAGS = /* @__PURE__ */ new Set(["PICTURE"]);
  var LINKED_DM_WRAPPER_SIBLING_TAGS = /* @__PURE__ */ new Set(["SOURCE"]);
  function findLinkedDmCarrier(img) {
    if (!img || !img.parentElement) return null;
    let node = img;
    let parent = img.parentElement;
    while (parent && LINKED_DM_INLINE_WRAPPER_TAGS.has(parent.tagName)) {
      let foundNode = false;
      for (const child of parent.children) {
        if (child === node) {
          foundNode = true;
        } else if (!LINKED_DM_WRAPPER_SIBLING_TAGS.has(child.tagName)) {
          return null;
        }
      }
      if (!foundNode) return null;
      node = parent;
      parent = parent.parentElement;
    }
    if (!parent || parent.tagName !== "A") return null;
    if (parent.children.length !== 1 || parent.children[0] !== node) return null;
    if (parent.textContent.trim() !== "") return null;
    return parent;
  }
  var EMPTY_ALT_SENTINEL = "Image without alt text";
  function altToLinkText(alt) {
    return alt || EMPTY_ALT_SENTINEL;
  }
  function transform3(hookName, element, payload) {
    if (hookName !== "afterTransform") return;
    const doc = element.ownerDocument;
    element.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src") || "";
      if (!detectDynamicMediaUrl(src)) return;
      const alt = img.getAttribute("alt") || "";
      const linkedAnchor = findLinkedDmCarrier(img);
      if (linkedAnchor) {
        linkedAnchor.setAttribute("title", src);
        linkedAnchor.textContent = altToLinkText(alt);
        return;
      }
      const parent = img.parentElement;
      if (parent && parent.tagName === "A") {
        console.warn("DM image inside mixed-content anchor, skipped:", src);
        return;
      }
      const a = doc.createElement("a");
      a.href = src;
      a.textContent = altToLinkText(alt);
      img.replaceWith(a);
    });
  }

  // tools/importer/import-homepage.js
  var parsers = {
    "hero-billboard": parse,
    "hero-promo": parse2,
    "cards-feature": parse3,
    "cards-announce": parse4,
    "cards-product": parse5,
    "cards-editorial": parse6,
    "cards-calc": parse7,
    "columns-stats": parse8
  };
  var PAGE_TEMPLATE = {
    name: "homepage",
    description: "Corporate homepage",
    urls: ["https://www.newyorklife.com/"],
    blocks: [
      { name: "hero-billboard", instances: ["section[data-section='hero']"] },
      { name: "hero-promo", instances: ["section[data-section='promo-assist']", "section[data-section='community-cta'] .cta-teaser"] },
      { name: "cards-feature", instances: ["section[data-section='personalized-guidance'] .feature-cards"] },
      { name: "cards-announce", instances: ["section[data-section='announcement']"] },
      { name: "cards-product", instances: ["section[data-section='products-solutions'] .product-cards"] },
      { name: "cards-editorial", instances: ["section[data-section='financial-insights'] .article-cards", "section[data-section='community-impact'] .community-cards"] },
      { name: "cards-calc", instances: ["section[data-section='financial-insights'] .calculator-cards"] },
      { name: "columns-stats", instances: ["section[data-section='about-stats'] .stats-grid"] }
    ],
    sections: [
      { id: "s2", name: "promo-assist", selector: "section[data-section='promo-assist']", style: "dark", blocks: ["hero-promo"], defaultContent: [] },
      { id: "s4", name: "announcement", selector: "section[data-section='announcement']", style: null, blocks: ["cards-announce"], defaultContent: [] },
      { id: "s5", name: "products-solutions", selector: "section[data-section='products-solutions']", style: "dark", blocks: ["cards-product"], defaultContent: [] },
      { id: "s7", name: "about-stats", selector: "section[data-section='about-stats']", style: "accent", blocks: ["columns-stats"], defaultContent: [] },
      { id: "s8", name: "community-impact", selector: "section[data-section='community-impact']", style: "green", blocks: ["cards-editorial", "hero-promo"], defaultContent: [] }
    ]
  };
  var transformers = [
    transform,
    transform3,
    // Always run: splits by authored <section>/<div data-*> elements in the DOM
    // regardless of how many styled sections the template lists.
    transform2
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          pageBlocks.push({ name: blockDef.name, selector, element, section: blockDef.section || null });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_homepage_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const path = WebImporter.FileUtils.sanitizePath(
        new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "")
      );
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_homepage_exports);
})();
