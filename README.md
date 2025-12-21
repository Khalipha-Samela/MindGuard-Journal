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
MindGuard-Journal
├─ android-chrome-192x192.png
├─ android-chrome-512x512.png
├─ apple-touch-icon.png
├─ assets
│  ├─ css
│  │  ├─ auth.css
│  │  └─ style.css
│  ├─ js
│  │  ├─ auth.js
│  │  ├─ history.js
│  │  ├─ journal-service.js
│  │  ├─ script.js
│  │  └─ supabase-config.js
│  └─ screenshots
│     ├─ dashboard.png
│     ├─ history.png
│     ├─ login.png
│     └─ register.png
├─ favicon-16x16.png
├─ favicon-32x32.png
├─ history.html
├─ index.html
├─ login.html
├─ README.md
└─ register.html

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

```
-- Create journal_entries table
CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'Untitled Entry',
    content TEXT NOT NULL,
    word_count INTEGER DEFAULT 0,
    
    -- Enhanced analysis fields
    risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    patterns JSONB DEFAULT '[]'::jsonb,
    triggers JSONB DEFAULT '[]'::jsonb,
    warnings JSONB DEFAULT '[]'::jsonb,
    grounding_techniques JSONB DEFAULT '[]'::jsonb,
    coping_strategies JSONB DEFAULT '[]'::jsonb,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_created_at ON journal_entries(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can only view their own entries
CREATE POLICY "Users can view own journal entries" 
    ON journal_entries FOR SELECT 
    USING (auth.uid() = user_id);

-- Users can insert their own entries
CREATE POLICY "Users can insert own journal entries" 
    ON journal_entries FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own entries
CREATE POLICY "Users can update own journal entries" 
    ON journal_entries FOR UPDATE 
    USING (auth.uid() = user_id);

-- Users can delete their own entries
CREATE POLICY "Users can delete own journal entries" 
    ON journal_entries FOR DELETE 
    USING (auth.uid() = user_id);

-- Create a trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_journal_entries_updated_at 
    BEFORE UPDATE ON journal_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

profiles **table**
- Stores additional user metadata
- Automatically created on signup using database triggers

✔️ **All queries are protected by RLS policies** using ```auth.uid()```.

```
-- Create profiles table to store additional user info
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own profile
CREATE POLICY "Users can view own profile" 
    ON profiles FOR SELECT 
    USING (auth.uid() = id);

-- Create policy for users to update their own profile
CREATE POLICY "Users can update own profile" 
    ON profiles FOR UPDATE 
    USING (auth.uid() = id);

-- Create policy for users to insert their own profile
CREATE POLICY "Users can insert own profile" 
    ON profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Create a trigger to create profile after user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name)
    VALUES (new.id, new.raw_user_meta_data->>'full_name');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

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

## 🚀 Live Demo

- **Live View:** [https://mindguard-journal.netlify.app/login.html]

---

## 📸 Screenshots

**Login**
![Login Page](/assets/screenshots/login.png)

**Register**
![Register Page](/assets/screenshots/register.png)

**Dashboard**
<br>
![Dashboard Page](/assets/screenshots/dashboard.png)

**History**
![History Page](/assets/screenshots/history.png)

---

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
