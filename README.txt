Sky to Soil PAL - Grade 9 Geography, Chapter 3: Atmosphere and Climate

PAGES
- index.html   : the student app.
- teacher.html : the teacher view. It shows every learner's progress and needs the teacher password.
  Students are never sent to this page. Open it yourself at <your site>/teacher.html

HOW TO USE
- Open index.html in any modern browser (Chrome, Edge, Firefox, Safari). No installation needed.
- Works offline once opened. Fonts load from Google Fonts when online; without internet the page uses system fonts.
- Progress reaches the teacher view only when the app is opened from the website (for example on Vercel),
  not when index.html is opened as a file.

WHAT IS SAVED
- On the student's device (localStorage): their name, class and answers. Clearing browser data resets progress.
- On the website's database: the same name, class and answers, sent a few seconds after each step,
  so the teacher view can show them. Each device counts as one learner.

ONE-TIME SETUP ON VERCEL (needed for the teacher view)
1. Open the project in Vercel, go to the Storage tab, choose "Upstash for Redis" (free plan) and connect it
   to this project. Vercel adds the database settings for you.
2. In Settings > Environment Variables, add TEACHER_PASSWORD with a password only teachers know.
3. Go to Deployments and redeploy the latest deployment so the new settings are used.
To change the password later, edit TEACHER_PASSWORD and redeploy.

SOURCE FILES (for developers)
- source/data.js    : learning outcomes, item bank (8 diagnostic + 44 practice/checkpoint items), lessons, tasks, video briefs
- source/svg.js     : the 14 diagrams, drawn in code
- source/app.js     : learner model, adaptive rules and screens; sends progress to api/save
- source/teacher.js : the teacher view
- source/shell.html : page styles and header
- api/save.js       : stores a learner's progress (Upstash Redis)
- api/learners.js   : returns all learners to the teacher view, after checking TEACHER_PASSWORD
After editing anything in source/, run: node build.js  (this rebuilds index.html and teacher.html)

Content source: NCERT, Understanding Society: India and Beyond, Grade 9 Part 1, Chapter 3. Data: Table 3.3.
