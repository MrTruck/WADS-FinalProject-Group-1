# Final Project – Web Application Development and Security 

**Course Code:** COMP6703001 
**Course Name:** Web Application Development and Security 
**Institution:** BINUS University International

## 1. Project Information
**Project Title:** 
Workload Reminder
**Project Domain:** 
Study Planner & Productivity Tracker
**Class:** 
L4BC
**Group Members:**
| Name | Student ID| Role | GitHub Username|
| ------------- | ------ | ------------- | ------ |
| HANINA ELIAS ABDOSH| 2802516030 | Backend | haninaabdosh
| PATRICK WILLIAM PRABOWO| 2802554520 | Frontend | MrTruck
| IMANUEL SHEVA G SIMANJUNTAK| 2802499592 | AI | Sheva123456

## 2. Instructor and Repository 
**Instructor:** Ida Bagus Kerthyayana Manuaba 
- Email: imanuaba@binus.edu 
- GitHub: bagzcode 

**Instructor Assistant:** Juwono 
- Email: juwono@binus.edu 
- GitHub: Juwono136

[GitHub Repository link](https://github.com/MrTruck/WADS-FinalProject-Group-1)

## 3. Project Overview
### 3.1 Problem Statement
With the increasing demand for productivity, emerges a need for students to keep tract and plan ahead of assignments and projects. These days, schools and similar institutions have started to increasingly shifted away from traditional paper examinations and began to use projects and assignments as a means to asses students understanding of a subject. These projects and assignments take a long period of time to finish and require rigorous planning and time management for successful executions. Additionally some schools implement both projects and examinations for assessments. Thus students need a tool to manage their time and workload to prevent burnout and missed deadlines. A tool like this will not only solve these new problems, it could also manage traditional school works such as assignments, quizzes, activities etc.

Existing tools are often de-centralised and dont integrate crucial features seamlessly, thus making students feel fragmented in their workflow. As their workloads increase, the lack of an integrated planning and productivity system negatively impacts performance, increases stress, and reduces learning ability.

#### Target Audience:
- University students  
- High school students
- Online course participants
- Any working individual

### 3.2 Solution Overview

#### Core features include:

1. **Task & Deadline Management:**
Create, edit, and delete assignments
Set deadlines and priorities
Track completion status

2. **Calendar Integration**
Visual monthly/weekly planner
Deadline overlays
Study session scheduling

3. **Study Session Timers**
Pomodoro or custom timers
Session start/stop tracking
Logged study durations

4. **Progress Analytics Dashboard**
Productivity charts
Study time trends
Completion rates

5. **Notifications & Reminders**
Deadline alerts
Study session reminders
Smart rescheduling prompts

#### Why this solution is appropriate:

This solution is appropriate because it directly addresses some of the root causes of academic disorganization:

- Centralization
Combines tasks, calendars, and timers into one platform

- Automation
Reduces reliance on memory through reminders

- Visualization
Calendar and dashboards improve planning clarity

- Data-driven insights
Analytics help students adjust study habits

- Accessibility
Web-based system accessible across devices

Which when compared to generic to-do apps, this system is academically specialized, supporting structured study workflows rather than simple task lists.

#### Where AI is used

Artificial Intelligence enhances the planner by adding intelligent automation and personalization.

1. **Study Schedule Recommendations**
Generates optimal study sessions based on:
Available time
Task difficulty
Upcoming deadlines

2. **AI-Based Burnout Detection**
The burnout detection module focuses on student well-being by identifying unhealthy study patterns and cognitive overload risks. Without any intervention, burnout can reduce academic performance and harm mental health.
**Data Monitored:**
*- Study Activity:* daily study duration, number of sessions per day, consecutive study days
*- Break Patterns:* break frequency, session spacing
*- Productivity Trends:* task completion rates, focus timer interruptions, declining performance analytics

## 4. Technology Stack 


| Layer| Technology|
|------|------------|
| Frontend         | Next.js  |
| Backend          | Node.js or Next.js |
| API              | REST API|
| Database         | PostgreSQL / Firebase (Auth only)|
| Containerization | Docker |
| Deployment       | AWS|
| Version Control  | GitHub |

## 5. System Architecture
### 5.1 Architecture Diagram 
#### Progressive architecture

                              ┌──────────────────────────┐
                              │        End Users          │
                              │  Students / Browsers      │
                              └─────────────┬────────────┘
                                            │ HTTPS / WSS
                                            ▼
┌────────────────────────────────────────────────────────────────┐
│                 FRONTEND (Next.js PWA)                          │
│                                                                │
│ • Task & Assignment UI                                         │
│ • Calendar Interface                                           │
│ • Study Timers                                                 │
│ • Analytics Dashboard                                          │
│ • Notification Settings                                        │
│                                                                │
│ Progressive Features:                                          │
│ • Service Workers (Offline caching)                            │
│ • Push Notifications                                           │
│ • Real-time updates (WebSockets)                               │
│                                                                │
│ Security:                                                      │
│ • Secure token storage                                         │
│ • Client validation                                            │
└──────────────┬─────────────────────────────────────────────────┘
               │ REST API / WebSocket (WSS)
               ▼
┌────────────────────────────────────────────────────────────────┐
│                    API GATEWAY / BACKEND                       │
│                   (Node.js / Next.js)                          │
│                                                                │
│ Core Services:                                                 │
│ • Task Management Service                                      │
│ • Calendar Service                                             │
│ • Study Session Service                                        │
│ • Analytics Service                                            │
│ • Notification Service                                         │
│                                                                │
│ Real-Time Layer:                                               │
│ • WebSocket Server                                             │
│ • Live timer sync                                              │
│ • Instant deadline updates                                     │
│                                                                │
│ Security Enforcement:                                          │
│ • Authentication (JWT / Firebase)                              │
│ • Access Control                                               │
│ • Rate limiting                                                │
│ • Session timeout                                              │
└──────────────┬─────────────────────────────────────────────────┘
               │
               │ ORM / Secure Queries
               ▼
┌────────────────────────────────────────────────────────────────┐
│                         DATABASE LAYER                          │
│                                                                │
│ PostgreSQL:                                                    │
│ • Tasks                                                        │
│ • Deadlines                                                    │
│ • Study Sessions                                               │
│ • Productivity Analytics                                       │
│ • Burnout Metrics                                              │
│                                                                │
│ Firebase Auth:                                                 │
│ • User Identity                                                │
│ • Access Tokens                                                │
│                                                                │
│ Security:                                                      │
│ • Encrypted storage                                            │
│ • Row-level authorization                                      │
└──────────────┬─────────────────────────────────────────────────┘
               │
               ▼
┌────────────────────────────────────────────────────────────────┐
│              REAL-TIME & ONLINE SERVICES LAYER                  │
│                                                                │
│ • Notification Scheduler (Cron Jobs)                            │
│ • Push Notification Server                                     │
│ • Email / Mobile Alerts                                        │
│ • AI Processing Workers                                        │
│                                                                │
│ AI Modules:                                                    │
│ • Study Schedule Generator                                     │
│ • Burnout Detection Engine                                     │
└────────────────────────────────────────────────────────────────┘


        ┌──────────────────────────────────────────────┐
        │         CONTAINERIZATION (Docker)              │
        │  • Frontend Container                          │
        │  • Backend + WebSocket Container               │
        │  • AI Worker Container                         │
        │  • Database Container                          │
        └──────────────────────┬────────────────────────┘
                               ▼
        ┌──────────────────────────────────────────────┐
        │            CLOUD DEPLOYMENT                   │
        │  Vercel / AWS / GCP / Render                  │
        │  CI/CD via GitHub                             │
        └──────────────────────────────────────────────┘
