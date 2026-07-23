#!/usr/bin/env node
/* Builds a Vault content package that overlays the jcr:content/root of the
   CitizensFSI index, nav, and footer pages at /content/citizensbank.
   Output: a ready-to-zip folder tree under ./pkg */
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'pkg');
const DAM = '/content/dam/citizensbank';

// --- helpers -------------------------------------------------------------
function attrEsc(s) {
  // XML attribute-value escaping. Vault also escapes commas/braces but our
  // values contain none of those in significant positions.
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function attrs(map) {
  return Object.entries(map)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `\n    ${k}="${attrEsc(v)}"`)
    .join('');
}
let sc = 0;
function sectionName() { return `section_${sc++}`; }

// A franklin "text" default-content component (richtext held in `text`).
function textComp(name, html) {
  return `<${name}
    jcr:primaryType="nt:unstructured"
    sling:resourceType="core/franklin/components/text/v1/text"
    text="${attrEsc(html)}"/>`;
}
// Auto-named text component (for sections with multiple default-content blocks).
let txtc = 0;
function text(html) { return textComp(`text_${txtc++}`, html); }

// A simple (non-container) block.
function block(name, blockName, model, fields, classes) {
  const base = { 'sling:resourceType': 'core/franklin/components/block/v1/block', name: blockName, model };
  if (classes) base.classes = classes;
  return `<${name}
    jcr:primaryType="nt:unstructured"${attrs({ ...base, ...fields })}/>`;
}

// A container block with repeated item children.
function containerBlock(name, blockName, filter, classes, items) {
  const base = { 'sling:resourceType': 'core/franklin/components/block/v1/block', name: blockName, filter };
  if (classes) base.classes = classes;
  const children = items.map((it, i) => `<item_${i}
      jcr:primaryType="nt:unstructured"${attrs({
    'sling:resourceType': 'core/franklin/components/block/v1/block/item',
    name: it.name,
    model: it.model,
    ...it.fields,
  }).replace(/\n    /g, '\n        ')}/>`).join('\n      ');
  return `<${name}
    jcr:primaryType="nt:unstructured"${attrs(base)}>
      ${children}
  </${name}>`;
}

function section(inner, classes) {
  const nm = sectionName();
  const cls = classes ? `\n    classes="${attrEsc(classes)}"` : '';
  return `<${nm}
    jcr:primaryType="nt:unstructured"
    sling:resourceType="core/franklin/components/section/v1/section"${cls}>
    ${inner.join('\n    ')}
  </${nm}>`;
}

// A franklin default-content image component.
let imgc = 0;
function imageComp(src, alt) {
  return `<image_${imgc++}
    jcr:primaryType="nt:unstructured"${attrs({
    'sling:resourceType': 'core/franklin/components/image/v1/image',
    image: src,
    imageAlt: alt,
  })}/>`;
}

function rootXml(sections) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:sling="http://sling.apache.org/jcr/sling/1.0"
    xmlns:cq="http://www.day.com/jcr/cq/1.0"
    xmlns:jcr="http://www.jcp.org/jcr/1.0"
    xmlns:nt="http://www.jcp.org/jcr/nt/1.0"
    jcr:primaryType="nt:unstructured"
    sling:resourceType="core/franklin/components/root/v1/root">
  ${sections.join('\n  ')}
</jcr:root>
`;
}

// Full cq:Page node. When `sections` is provided, includes the franklin
// root content; otherwise emits a bare container page (for intermediate
// path segments like about-us / student / student/articles).
function pageXml(title, sections) {
  const indented = sections
    ? sections.join('\n      ').replace(/\n/g, '\n    ')
    : null;
  const rootInner = indented
    ? `
      <root
          jcr:primaryType="nt:unstructured"
          sling:resourceType="core/franklin/components/root/v1/root">
        ${indented}
      </root>`
    : '';
  return `<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:sling="http://sling.apache.org/jcr/sling/1.0"
    xmlns:cq="http://www.day.com/jcr/cq/1.0"
    xmlns:jcr="http://www.jcp.org/jcr/1.0"
    xmlns:nt="http://www.jcp.org/jcr/nt/1.0"
    jcr:primaryType="cq:Page">
  <jcr:content
      jcr:primaryType="cq:PageContent"
      sling:resourceType="core/franklin/components/page/v1/page"
      jcr:title="${attrEsc(title)}">${rootInner}
  </jcr:content>
</jcr:root>
`;
}

// --- INDEX ---------------------------------------------------------------
sc = 0;
const indexSections = [
  // Section 1: FDIC banner + hero
  section([
    block('block', 'FDIC Banner', 'fdic-banner', {
      image: `${DAM}/fdic-logo.svg`,
      imageAlt: 'FDIC',
      text: '<p>FDIC-Insured — Backed by the full faith and credit of the U.S. Government</p>',
    }),
    block('block_1', 'Hero Commercial', 'hero-commercial', {
      image: `${DAM}/hero-app.png`,
      imageAlt: 'Citizens App Preview',
      text: '<h1>Welcome to simplified checking and payments.</h1><p>One account to spend, save, and move your money, with the tools to stay on top of it all.</p><p><strong><a href="/checking">Get Started</a></strong></p>',
    }),
  ]),
  // Section 2: feature-grid (image) — 4 product cards
  section([
    containerBlock('block', 'Feature Grid', 'feature-grid', 'image', [
      { name: 'Feature Card', model: 'feature-card', fields: { image: `${DAM}/card-credit-cards.jpg`, imageAlt: 'Credit cards', text: '<h3>A card for where you are and where you’re going</h3><p><a href="/credit-cards">Explore credit cards</a></p>' } },
      { name: 'Feature Card', model: 'feature-card', fields: { image: `${DAM}/card-multi-year-approval.jpg`, imageAlt: 'Multi-Year Approval', text: '<h3>Pay for college with Multi-Year Approval</h3><p><a href="/student-loans">Learn about multi-year approval</a></p>' } },
      { name: 'Feature Card', model: 'feature-card', fields: { image: `${DAM}/card-home-equity.jpg`, imageAlt: 'Home equity', text: '<h3>Money in as little as two weeks</h3><p><a href="/home-equity">Use your home equity</a></p>' } },
      { name: 'Feature Card', model: 'feature-card', fields: { image: `${DAM}/card-round-ups.jpg`, imageAlt: 'Round Ups savings', text: '<h3>Turn your spare change into savings with Round Ups</h3><p><a href="/savings">Start Saving</a></p>' } },
    ]),
  ]),
  // Section 3: section-title + feature-grid (icon) — 4 service cards
  section([
    block('block', 'Section Title', 'section-title', {
      title: '<p>Customer service at your fingertips</p>',
      text: '<p>Bank on your terms, online, on the app, or with a banker.</p>',
    }),
    containerBlock('block_1', 'Feature Grid', 'feature-grid', 'icon', [
      { name: 'Feature Card', model: 'feature-card', fields: { image: `${DAM}/icon-mobile.svg`, imageAlt: 'Mobile and online banking', text: '<h3>Mobile and Online Banking</h3><p><a href="/login">Login to online banking</a></p>' } },
      { name: 'Feature Card', model: 'feature-card', fields: { image: `${DAM}/icon-contact.svg`, imageAlt: 'Contact us', text: '<h3>Contact Us</h3><p><a href="/contact">Customer Service</a></p>' } },
      { name: 'Feature Card', model: 'feature-card', fields: { image: `${DAM}/icon-branch.svg`, imageAlt: 'Find a branch', text: '<h3>Find a Branch or ATM</h3><p><a href="/locator">Find a branch near you</a></p>' } },
      { name: 'Feature Card', model: 'feature-card', fields: { image: `${DAM}/icon-banker.svg`, imageAlt: 'Meet with a banker', text: '<h3>Meet with a banker</h3><p><a href="/appointment">Schedule an appointment</a></p>' } },
    ]),
  ]),
];

// --- NAV (default content fragment: 3 sections) --------------------------
sc = 0;
const navSections = [
  section([textComp('text', '<p><a href="/">Citizens</a></p>')]),
  section([textComp('text', '<ul><li>Bank<ul><li><a href="/checking">Checking</a></li><li><a href="/savings">Savings</a></li><li><a href="/cds">CDs &amp; Money Market</a></li></ul></li><li>Borrow<ul><li><a href="/credit-cards">Credit Cards</a></li><li><a href="/home-equity">Home Equity</a></li><li><a href="/student-loans">Student Loans</a></li><li><a href="/mortgage">Mortgage</a></li></ul></li><li>Invest<ul><li><a href="/wealth">Wealth Management</a></li><li><a href="/retirement">Retirement</a></li></ul></li><li><a href="/learn">Learn</a></li></ul>')]),
  section([textComp('text', '<ul><li><a href="/login">Login</a></li><li><a href="/locator">Locations</a></li><li><a href="/contact">Customer Service</a></li></ul>')]),
];

// --- FOOTER (default content fragment: 1 section) ------------------------
sc = 0;
const footerSections = [
  section([textComp('text', '<p>Get in Touch</p><ul><li><a href="/contact">Customer Service</a></li><li><a href="/locator">Find a Branch or ATM</a></li><li><a href="/appointment">Schedule an Appointment</a></li></ul><p>Products</p><ul><li><a href="/checking">Checking &amp; Savings</a></li><li><a href="/credit-cards">Credit Cards</a></li><li><a href="/home-equity">Home Equity</a></li><li><a href="/wealth">Wealth Management</a></li></ul><p>About</p><ul><li><a href="/about">About Citizens</a></li><li><a href="/careers">Careers</a></li><li><a href="/newsroom">Newsroom</a></li></ul><p>FDIC-Insured — Backed by the full faith and credit of the U.S. Government</p><p>© 2026 Citizens Financial Group, Inc. All rights reserved. Citizens is a brand name of Citizens Bank, N.A. Member FDIC.</p>')]),
];

// --- ABOUT-US / OVERVIEW -------------------------------------------------
sc = 0; imgc = 0; txtc = 0;
const aboutSections = [
  // Hero
  section([
    block('block', 'Hero Commercial', 'hero-commercial', {
      image: `${DAM}/about-hero-colleagues.jpg`,
      imageAlt: 'Citizens colleagues',
      text: '<h1>Made for what’s possible. Ready to make it happen.</h1><p>We have the skills, knowledge and passion to help our customers, colleagues and communities reach their potential.</p>',
    }),
  ]),
  // Grey band: section-title + feature-grid (stats)
  section([
    block('block', 'Section Title', 'section-title', {
      title: '<p>A culture that embraces curiosity</p>',
      text: '<p>Helping others reach their potential takes people who can rethink what’s possible. We embrace lifelong learners and offer career paths that can go wherever your skills and interests take you.</p>',
    }),
    containerBlock('block_1', 'Feature Grid', 'feature-grid', 'stats', [
      { name: 'Feature Card', model: 'feature-card', fields: { text: '<h3>31%</h3><p>Of open roles were filled by colleagues</p>' } },
      { name: 'Feature Card', model: 'feature-card', fields: { text: '<h3>700+</h3><p>Colleagues completed leadership upskilling</p>' } },
      { name: 'Feature Card', model: 'feature-card', fields: { text: '<h3>420,000+</h3><p>Hours spent on career development training</p>' } },
      { name: 'Feature Card', model: 'feature-card', fields: { text: '<h3>Explore career options</h3><p>Explore our career opportunities to find the right job for you.</p>' } },
    ]),
  ], 'section-grey'),
  // Made for the moment: section-title + feature-grid (image)
  section([
    block('block', 'Section Title', 'section-title', {
      title: '<p>Made for the moment</p>',
      text: '<p>The biggest games. The biggest stages. The biggest stars. Citizens is proud to sponsor some of the most recognizable names in sports and entertainment and elevate the live experiences we’re all so passionate about.</p>',
    }),
    containerBlock('block_1', 'Feature Grid', 'feature-grid', 'image', [
      { name: 'Feature Card', model: 'feature-card', fields: { image: `${DAM}/about-citizens-bank-park.png`, imageAlt: 'Citizens Bank Park', text: '<h3>Citizens Bank Park</h3>' } },
      { name: 'Feature Card', model: 'feature-card', fields: { image: `${DAM}/about-citizens-live.jpg`, imageAlt: 'Citizens Live', text: '<h3>Citizens Live®</h3>' } },
      { name: 'Feature Card', model: 'feature-card', fields: { image: `${DAM}/about-devils-prudential.jpg`, imageAlt: 'Devils and Prudential Center', text: '<h3>Devils &amp; Prudential Center</h3>' } },
      { name: 'Feature Card', model: 'feature-card', fields: { image: `${DAM}/about-nyrr.jpg`, imageAlt: 'New York Road Runners', text: '<h3>New York Road Runners</h3>' } },
    ]),
  ]),
  // Impact band (default content, styled section)
  section([
    text('<h2>Committed to making an impact</h2><p>We’re dedicated to fostering strong communities, driving positive environmental impact and building the workforce of the future.</p><p><strong><a href="https://www.citizensbank.com/about-us/sustainability-impact.aspx">See Our Impact</a></strong></p>'),
  ], 'impact-band'),
  // Stats: section-title + feature-grid (stats) + note
  section([
    block('block', 'Section Title', 'section-title', {
      title: '<p>Strong. Steady. Stable. Successful.</p>',
      text: '<p>Citizens is one of the oldest and largest financial institutions in the nation. We’re proud of our history and 10 years of growth since our IPO, positioning us for a bright future.</p>',
    }),
    containerBlock('block_1', 'Feature Grid', 'feature-grid', 'stats', [
      { name: 'Feature Card', model: 'feature-card', fields: { text: '<h3>$220.1 billion</h3><p>Total Assets</p>' } },
      { name: 'Feature Card', model: 'feature-card', fields: { text: '<h3>$177.6 billion</h3><p>Deposits</p>' } },
      { name: 'Feature Card', model: 'feature-card', fields: { text: '<h3>1,000</h3><p>Branches</p>' } },
      { name: 'Feature Card', model: 'feature-card', fields: { text: '<h3>3,100</h3><p>ATMs</p>' } },
    ]),
    text('<p><em>as of June 30th, 2025</em></p>'),
  ]),
];

// --- ARTICLE (student/articles/...) --------------------------------------
// Mostly default content inside an "article"-styled section, with a callout block.
sc = 0; imgc = 0; txtc = 0;
const articleSections = [
  section([
    text('<p><a href="/">Home</a> / <a href="/student">Student</a> / Articles</p>'),
    text('<h1>How to save money in high school</h1>'),
    imageComp(`${DAM}/article-savings-hero.jpg`, 'High school student saving money for college'),
    block('block', 'Callout', 'callout', {
      text: '<h2>Key takeaways</h2><ul><li>Saving money in high school is important so you learn to build financial habits that stick, reach your financial goals faster, and learn the value of money.</li><li>Whether it’s putting aside special occasion money, your allowance, income from odd jobs or part-time work, or earnings from a creative side hustle, every bit counts.</li><li>Saving alone isn’t enough; instead, create a budget where you can keep track of how much you’re earning, saving, and spending, and then pair that with smart spending habits to ensure you reach your financial goals.</li></ul>',
    }),
    text('<p>It’s never too early to start saving money in high school—especially if you are saving <a href="https://www.collegeraptor.com/paying-for-college/articles/financial-advice-planning/good-money-habits/">money for college</a>. Yes, even in high school, there are a number of things you can do to help ease the financial strain later on when it comes to tuition, living expenses, and other college fees. Wondering how to save money in high school? Here are a few ways you can start saving now.</p><h2>Why you should start saving money in high school</h2><p>While saving money in high school might not sound like the most exciting thing, it’s smart to learn how to save now, before you live on your own. Here are a few reasons why:</p><ul><li><strong>You’ll build financial habits that stick</strong>. By saving a little bit now (we’re talking even just $10-$20 a week), you learn the importance of consistency and how to manage money—whether you have a little or a lot.</li><li><strong>You’ll reach future financial goals faster</strong>. Want to afford all of your college textbooks, buy a new car, or even go on a trip with friends without all the money stress? When you take the time to figure out how much you’ll need, you can start to actively work towards the life you want.</li><li><strong>You’ll understand the value of money</strong>. When you’re spending your own money, you become increasingly more conscious of how much things actually cost—and that awareness can often lead to wiser decisions when it comes to spending. Maybe those new shoes are worth it, or maybe you’d rather hang onto that cash and put it towards a bigger, more meaningful goal. The decision is yours, so choose carefully.</li></ul><h2>5 great ways to save money in high school</h2><p>Many people think that to start saving money in high school, you have to work a job. While having a part-time job certainly can help, here are other ways you can start to save:</p><h3>1. Special occasion money</h3><p>Opening cards on your birthday, graduation, or Christmas morning can be just as exciting as unwrapping the gifts, especially when there’s a crisp $10, $20, or (if you’re lucky) even more tucked inside. However, before you rush to spend it, consider sticking it in your bank account. That way, it can start to accrue some interest, and it’s out of temptation’s reach.</p><p>If you’ve really been trying to save up for something you want, try the half-and-half approach: stick half of the cash in the bank and tuck the other half in your pocket. Just make sure whatever you’re spending it on is really worth it. If not, saving is probably the better option.</p><h3>2. Allowance</h3><p>If your parents or guardians dole out a weekly or monthly allowance, ask them if they could instead transfer it straight into your savings account rather than into your checking account or giving you the money directly. Like saving your special occasion money, it’s better to get any amount of interest you can, as early as you can.</p><p>Your allowance is most likely a steady stream of funds, however large or small, that can really add up over time. Use it to give yourself some cushion when it comes to future <a href="https://www.citizensbank.com/student/articles/true-cost-of-college.aspx">college expenses</a>, like unexpected fees, late-night food runs, or even a futon for your dorm room. Being able to buy quick wants might seem nice now, but saving can set you up for the things you’ll actually need later.</p><h3>3. Odd jobs and chores</h3><p>If your parents are willing to pay you for them, offer to do some bigger chores around the house—just aim for things that aren’t already on your regular chore list. This could be organizing the garage, deep-cleaning the fridge, painting the bonus room, or even mending a broken fence.</p><p>You can also take odd jobs around the neighborhood if your neighbors are up for it. Start a small dog-walking service, mow yards, or pull weeds from gardens for a small fee. Any amount of income can help, and you might be surprised how many people are willing to pay for help with the tasks they just don’t have time for.</p><h3>4. Paychecks</h3><p>Like we said, one of the best ways to save up money for college is by finding a <a href="https://www.citizensbank.com/student/articles/part-time-jobs-for-high-school-college-students.aspx">part-time job</a>. Think babysitting, retail, barista shifts, lifeguarding, serving tables—whatever fits your schedule and interests. Whether you work in the summer or during the school year, even a minimum wage opportunity can be a big help. Paychecks are a great source of steady revenue that can also be deposited right into your savings account.</p><p>Some jobs might feel boring or tedious at times, but you’ll thank yourself in the end when you can pay for textbooks and something other than instant ramen for dinner. Not to mention, jobs like these look great on a college application—so it’s a win-win.</p><h3>5. Get creative!</h3><p>If you have a particular skill, put that talent to work. Maybe you love to make art. If so, make an Etsy shop and start selling your art online. If you’re obsessed with organizing, host a garage sale and earn some money in return—also getting rid of some old things while you’re at it. Maybe you love a certain subject. Offer up services to your fellow students, like tutoring, editing papers, or helping with test prep. Whatever your gift is, there is a good chance you can earn some money from it through a <a href="https://www.collegeraptor.com/find-colleges/articles/student-life/side-hustles-for-college-students/">side hustle</a>.</p><h2>Create a budget</h2><p>Once you have a steady stream of money coming in, it’s important to know how to manage it. While you’re still in high school, you might have the advantage of saving more since you’re not covering big living expenses just yet. In this case, a budget can really help you make sense of what’s coming in each month—and where it’s going.</p><p><a href="https://www.citizensbank.com/learning/50-30-20-budget.aspx">Budgeting</a> doesn’t have to be complicated, it can be as simple as tracking three categories: earning, saving, and spending. You can use a budgeting app that links to your bank account or make a simple spreadsheet. Just make sure your <a href="https://www.citizensbank.com/savings/savings-accounts/savings-tracker.aspx">savings goals</a> are clearly outlined in your budget. This is a way to ensure you control your money instead of the other way around.</p><h2>Adopt smart spending habits</h2><p>Smart spending is all about the small decisions you make in your everyday life. If you’re grabbing coffee on the way to school every morning, consider what it adds up to—and then try making coffee at home a few days a week instead. If your friends are constantly suggesting plans that cost money, offer up a free alternative like hanging at a local park or hosting a movie night at your house.</p><p>It’s also okay to say no! Peer pressure is real, but so is your financial future. Be upfront with your friends and let them know that you are trying to save up for your financial goals. Communicating your intentions with others can help you stay on track and also decrease the urge to overspend on unnecessary items.</p><p>When it comes to saving money in high school, every little bit counts. Whether it’s babysitting on the weekends, skipping your daily coffee run, or saving your birthday money, you are building saving habits that are going to stick with you for years to come. It might not seem like much now, but just know that every time you deposit money into your savings account, you are one step closer to reaching your goals. Your future self will thank you later!</p><p>There are many ways to pay for college, whether it’s through scholarships, grants, loans, or internships. They are all available to help pay for your tuition! Use College Raptor’s <a href="https://www.collegeraptor.com/college-search/">College Match tool</a> to see what kind of financial aid you can receive from specific colleges as well!</p><p><em>Any school represented in this article does not endorse and is not affiliated with Citizens or any Citizens Student Loan products or services.</em></p>'),
  ], 'article'),
];

// --- write jcr_root tree -------------------------------------------------
const BASE = ['jcr_root', 'content', 'citizensbank'];

// Existing pages: overlay only jcr:content/root (page + template already exist).
function writeRootOverlay(page, sections) {
  const dir = path.join(OUT, ...BASE, page, '_jcr_content', 'root');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, '.content.xml'), rootXml(sections));
}

// New pages: emit a full cq:Page node (its .content.xml lives at the page dir).
function writePage(segments, title, sections) {
  const dir = path.join(OUT, ...BASE, ...segments);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, '.content.xml'), pageXml(title, sections));
}

fs.rmSync(OUT, { recursive: true, force: true });
// Overlays into pages the wizard already created.
writeRootOverlay('index', indexSections);
writeRootOverlay('nav', navSections);
writeRootOverlay('footer', footerSections);

// New content pages — full cq:Page nodes, including intermediate container pages
// so no path segment defaults to nt:folder (which caused the root constraint error).
writePage(['about-us'], 'About Us');
writePage(['about-us', 'overview'], 'Overview', aboutSections);
writePage(['student'], 'Student');
writePage(['student', 'articles'], 'Articles');
writePage(['student', 'articles', 'high-school-students-can-start-saving-money-college'],
  'How to save money in high school', articleSections);

// --- META-INF ------------------------------------------------------------
const vaultDir = path.join(OUT, 'META-INF', 'vault');
fs.mkdirSync(vaultDir, { recursive: true });
fs.writeFileSync(path.join(vaultDir, 'filter.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<workspaceFilter version="1.0">
    <filter root="/content/citizensbank/index/jcr:content/root"/>
    <filter root="/content/citizensbank/nav/jcr:content/root"/>
    <filter root="/content/citizensbank/footer/jcr:content/root"/>
    <filter root="/content/citizensbank/about-us"/>
    <filter root="/content/citizensbank/student"/>
</workspaceFilter>
`);
fs.writeFileSync(path.join(vaultDir, 'properties.xml'), `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE properties SYSTEM "http://java.sun.com/dtd/properties.dtd">
<properties>
    <comment>CitizensFSI content overlay</comment>
    <entry key="name">citizens-content</entry>
    <entry key="version">1.2</entry>
    <entry key="group">aemxsc</entry>
    <entry key="description">Overlays index/nav/footer content roots and creates about-us/overview and the student savings article as full cq:Page nodes.</entry>
</properties>
`);

console.log('Package tree written to', OUT);
