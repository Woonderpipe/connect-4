# Store Listing Copy

## Classification

- App or game: Game
- Category: Board
- Suggested tags: Board, Casual, Offline, Multiplayer
- Monetization: Free; no ads; no in-app purchases
- Target audience: 13–15, 16–17, 18+
- Contact: `<PROJECT_ISSUES_URL>`
- Privacy policy: `https://example.com/privacy`

## English (en-US)

**Title**
Connect 4

**Short description**
Four-in-a-row with AI, local duels, online play, and creative game modes.

**Full description**

Drop a disc, build your line, and outthink your opponent in a polished four-in-a-row game.

Choose the way you want to play:

- Challenge the computer with easy, medium, and hard difficulty.
- Share one device for a local two-player match.
- Create an online game and invite a friend with a code or link.
- Explore alternate modes including Pop Out, gravity shifts, bombs, wild columns, power-ups, rising floors, and Connect 5.
- Use optional turn timers, undo, move history, and tabletop mode.
- Personalize player colors, light or dark appearance, and language.

Connect 4 supports 16 major languages, including right-to-left Arabic layout and Arabic numeral display. Local games and settings remain on your device. No account is required, and the app contains no ads or in-app purchases.

## German (de-DE)

**Title**
Vier Gewinnt

**Short description**
Vier Gewinnt mit KI, lokalen Duellen, Online-Spiel und kreativen Modi.

**Full description**

Setze einen Stein, baue deine Reihe auf und überliste deinen Gegner in einer modernen Vier-Gewinnt-Version.

Spiele so, wie du möchtest:

- Fordere die KI in drei Schwierigkeitsstufen heraus.
- Spiele ein lokales Duell zu zweit auf einem Gerät.
- Erstelle ein Online-Spiel und lade Freunde per Code oder Link ein.
- Entdecke Varianten wie Pop Out, wechselnde Schwerkraft, Bomben, wilde Spalten, Power-ups, steigenden Boden und Connect 5.
- Nutze auf Wunsch Zugtimer, Rückgängig, Zugverlauf und Tischmodus.
- Passe Spielerfarben, helles oder dunkles Design und Sprache an.

Die App unterstützt Deutsch, Englisch und Arabisch. Lokale Spiele und Einstellungen bleiben auf dem Gerät. Es ist kein Konto erforderlich; die App enthält keine Werbung und keine In-App-Käufe.

## Arabic (ar)

**Title**
أربعة على التوالي

**Short description**
العب ضد الذكاء الاصطناعي أو صديق محلياً أو عبر الإنترنت بأنماط متنوعة.

**Full description**

أسقط قرصاً، وابنِ صفك، وتفوّق على خصمك في لعبة أربعة على التوالي بتصميم حديث.

اختر أسلوب اللعب المناسب لك:

- تحدَّ الذكاء الاصطناعي بثلاثة مستويات للصعوبة.
- العب مع صديق على الجهاز نفسه.
- أنشئ لعبة عبر الإنترنت وشارك رمزاً أو رابط دعوة.
- جرّب أنماطاً إضافية تشمل تبدّل الجاذبية والقنابل والأعمدة البرية والقوى الخاصة والأرضية الصاعدة وConnect 5.
- استخدم مؤقت الأدوار والتراجع وسجل النقلات ووضع الطاولة اختيارياً.
- خصص ألوان اللاعبين والمظهر الفاتح أو الداكن واللغة.

يدعم التطبيق العربية والألمانية والإنجليزية، بما في ذلك اتجاه الكتابة من اليمين إلى اليسار والأرقام العربية. تبقى الألعاب المحلية والإعدادات على جهازك. لا يلزم إنشاء حساب، ولا توجد إعلانات أو مشتريات داخل التطبيق.

## Asset alt text

- Feature graphic: `Red and yellow discs converging on a glowing four-in-a-row board.`
- Gameplay screenshot: `A four-in-a-row match in progress with red and yellow discs.`
- Modes screenshot: `Game settings showing AI, local, online, and alternate modes.`
- Online screenshot: `Online invitation controls with game code and share options.`
- Arabic result screenshot: `Arabic right-to-left victory dialog with replay and share controls.`

## Marketing screenshot upload order (English)

1. `marketing/en/01-hero.png` - Classic strategy. Fresh energy.
2. `marketing/en/02-modes.png` - Play your way.
3. `marketing/en/03-variants.png` - Every match can change.
4. `marketing/en/04-online.png` - Friends are one code away.
5. `marketing/en/05-customize.png` - Make it yours.
6. `marketing/en/06-languages.png` - Play in your language.
7. `marketing/en/07-tabletop-together.png` - Two players. One screen.

All seven files are opaque 24-bit PNGs at 1080x1920. The first six keep authentic UI dominant inside distinct campaign compositions. The seventh presents tabletop mode as a core same-device multiplayer USP with the real flipped game board perspective-mapped into the phone display.

### Final screenshot alt text

- Hero: `A lively four-in-a-row match framed by glossy red and yellow discs.`
- Modes: `Game settings for AI, local two-player, and online matches.`
- Variants: `Enabled alternate modes including gravity, bombs, Pop Out, and power-ups.`
- Online: `Online match controls for creating, joining, and sharing a game.`
- Customization: `Customization controls for colors, language, dark mode, and tabletop mode.`
- Languages: `Arabic right-to-left victory screen surrounded by celebratory game pieces.`
- Tabletop: `Two people playing tabletop mode together on one premium phone from opposite sides.`

### Regenerating the campaign

- Capture clean authentic UI states: `corepack pnpm playstore:capture`
- Render and validate the final assets: `corepack pnpm playstore:render`
- Edit copy and layout assignment in `assets/marketing/campaign.en.json`.
- Keep generated background plates under `assets/source/backgrounds/` and raw app captures under `assets/source/screens/`.
- Capture removes the Next.js development portal before every source screenshot.
- The app hides browser scrollbars while preserving scrolling behavior.
- Stop any other Next.js development process for this workspace before running the isolated capture command.
