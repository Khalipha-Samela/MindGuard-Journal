## MindGuard Journal — AI-Powered Trauma Insight Journal

MindGuard Journal is a **privacy-focused, AI-assisted journaling web application** designed to help users reflect on their thoughts, understand emotional patterns, identify potential trauma triggers, and receive grounding techniques and coping strategies.

This project demonstrates **real-world frontend development**, including secure authentication, user-specific data handling, complex client-side logic, and thoughtful UX design for sensitive mental-health contexts.

---

## 🚀 Key Features

**🔐 Authentication System**
- Secure user registration & login (Supabase Auth)
- Password visibility toggle
- Client-side validation
- Clear form feedback & error handling
- Session-based route protection

**📓 Smart Journal Editor**
- Real-time word count
- Auto-disable analyze button when empty
- Clean, distraction-free writing space
- UX-focused flow for daily journaling

**🧠 AI-Powered Analysis Engine (Client-Side Logic)**
Journal entries are analyzed across **five core dimensions** using a custom JavaScript rules-based engine:

**1. Recurring Emotional Patterns**
Detects trends related to emotions, sleep, work stress, social interaction, and self-worth.

**2. Potential Trauma Triggers**
Identifies keywords and assigns intensity levels (low/medium/high).
Includes context extraction & recommended approaches.

**3. Early Warning Predictions**
Flags emotional escalation, dissociation indicators, sleep disruption, and trigger accumulation.

**4. Grounding Techniques**
Provides step-by-step exercises (Box Breathing, Visualization, Progressive Relaxation, etc.).

**5. Personalized Coping Strategies**
Suggestions adapt to emotional patterns, anxiety indicators, and stress factors.


## 📊 Dashboard Insights
- Visual risk-level indicator
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

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Authentication:** Supabase Auth
- **Database:** Supabase PostgreSQL
- **AI Logic:** Custom JavaScript analysis engine
- **Icons:** Font Awesome

---

## 📂 Project Structure
```
MindGuard-Journal/
├── index.html                  # Main dashboard
├── history.html                # Journal history page
├── login.html                  # Login page
├── register.html               # Registration page
├── css/
│   ├── style.css               # Main styles
│   └── auth.css                # Authentication styles
├── js/
│   ├── script.js               # Main application logic
│   ├── history.js              # History page logic
│   ├── auth.js                 # Authentication logic
│   ├── supabase-config.js      # Supabase configuration
│   └── journal-service.js      # Database service layer
└── README.md        

```

---

## 🗄️ Database Setup (Supabase)

**Required Table:** ```journal_entries```
This project uses Supabase PostgreSQL with Row Level Security (RLS) to ensure users can only access their own data.

journal_entries **table**
- Secure, user-scoped journal storage
- Indexed for performance
- JSONB fields for flexible analysis data
- Automatic timestamp management

profiles **table**
- Stores additional user metadata
- Automatically created on signup using database triggers

✔️ **All queries are protected by RLS policies** using ```auth.uid()```.

---

## 📦 How to Run Locally

**1. Clone the repo**
```
git clone https://github.com/Khalipha-Samela/MindGuard-Journal.git
```

**2. Open the project folder**

```
cd MindGuard-Journal
```

**3. Run with any local server** 
Example:
- VS Code - **Live Server**
- Open ```login.html```

----

## 🔒 Privacy & Security
- User data is **scoped per account** using Supabase Auth & RLS
- No shared or public data access
- Designed with privacy-first principles in mind

This ensures:
- Full privacy
- No external storage
- Instant access without latency

---

## 🧠 Professional Disclaimer

MindGuard Journal is a **self-reflection and wellness support tool.**

It is **not a replacement for professional mental health care**. If you are experiencing severe distress, please seek help from a qualified professional or local support services.

---

## 🧩 Future Features (Roadmap)
- Cloud backup with encryption
- Visual analytics dashboard
- Dark mode
- Real AI model integration
- PWA support

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!
Feel free to open a PR or issue in the repository.

---

## 📄 License

This project is licensed under the MIT License.
You are free to use, modify, and distribute it under the terms of the license.