## MindGuard Journal — AI-Powered Trauma Insight Journal

MindGuard Journal is a **privacy-focused, AI-assisted journaling web app** that helps users reflect on their thoughts, understand emotional patterns, detect potential trauma triggers, and receive grounding techniques and coping strategies.

Users can create secure accounts, write daily entries, get instant analysis, and view their full emotional journey in a clean, modern dashboard.

---

## 🚀 Features

**🔐 Authentication System**
- User registration & login
- Password visibility toggle
- Client-side validation
- Form feedback & error handling

**📓 Smart Journal Editor**
- Real-time word count
- Auto-disable analyze button when empty
- Clean, distraction-free writing space

**🧠 AI-Powered Analysis Engine**
Your text is analyzed across **5 major dimensions:**

**1. Recurring Patterns**
Detects emotional, social, sleep-related, work-related, and self-worth patterns over time.

**2. Potential Trauma Triggers**
Identifies keywords and assigns intensity levels (low/medium/high).
Includes context extraction & recommended approaches.

**3. Early Warning Predictions**
Highlights emotional escalation, dissociation signs, sleep issues, and multiple trigger accumulation.

**4. Grounding Techniques**
Provides step-by-step exercises (Box Breathing, Visualization, Progressive Relaxation, etc.).

**5. Personalized Coping Strategies**
Based on emotional patterns, sleep disruption, social anxiety, and more.


## 📊 Dashboard Insights
- Visual risk meter
- Analysis cards for patterns, triggers, warnings, grounding, and coping
- Clean UI with responsive card-based layout

## 📜 Journal History Page
- Shows all past entries
- Expanding sections with full entry + analysis
- Delete confirmation dialog
- Automatic re-analysis if entries were from older versions

## 🎨 Modern UI / UX
- Soft neutral color palette
- Glassy header & smooth shadows
- Styled buttons, cards, containers
- Fully responsive layout

---

## 🛠️ Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Styling:** Custom CSS (no frameworks)
- **Storage:** Browser LocalStorage
- **AI Logic:** Custom JavaScript analysis engine
- **Icons:** Font Awesome

---

## 📂 Project Structure
```
/
│── index.html          # Dashboard + journal editor
│── login.html          # User login page
│── register.html       # User registration page
│── history.html        # Journal history & past insights
│
│── css/
│   ├── style.css       # Main UI styling
│   └── auth.css        # Auth pages styling
│
│── js/
│   ├── script.js       # AI analysis engine + dashboard logic
│   ├── auth.js         # Login & register logic
│   └── history.js      # History page rendering + delete system
│
└── README.md
```

---

## 📦 How to Run Locally

**1. Clone the repo**
```
git clone https://github.com/yourusername/MindGuard-Journal.git
```

**2. Open the project folder**

```
cd MindGuard-Journal
```

**3. Run with any local server** (recommended for correct file paths)

Examples:

**VS Code Live Server:**
Right-click ```index.html``` → Open with Live Server

Then visit:
```
http://localhost:5500
```

----

## 🔒 Privacy Notice
All entries are **stored locally in the user’s browser.**
No data is uploaded or transmitted to any server.

This ensures:
- Full privacy
- No external storage
- Instant access without latency

---

## 🧩 Future Features (Roadmap)
- Cloud backup with encryption
- Mood charts & emotional trends
- Mobile app version
- Dark mode
- AI-generated affirmations
- Tagging system for journal entries

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!
Feel free to open a PR or issue in the repository.

---

## 📄 License

This project is licensed under the MIT License.
You are free to use, modify, and distribute it under the terms of the license.