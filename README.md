# 🚀 AI-Powered Performance Comparison Framework (Pilot Version)

This framework is a **next-generation performance analysis tool** that automates the comparison of **JMeter JTL** and **Splunk PDF/HTML** reports, augmented with **Google Gemini Flash 2.0** for **intelligent, actionable insights**.  

🎥 Demo: *Introducing: AI-Powered Performance Comparison Framework using Gemini Flash 2.0*  

---

## ✨ Key Features & Architecture

### 🎨 Intuitive User Interface (Electron Desktop App)
- Sleek desktop environment for **report file selection & comparison**.  
- **Parallel layout** for Baseline vs. Latest reports (JMeter JTL & Splunk).  
- **Real-time feedback** with a `"Generating Report"` indicator.  

### 🧩 Advanced Data Parsing & Extraction
- **JMeter JTL files** parsed directly in **Node.js backend**.  
- **Splunk PDF/HTML reports** parsed via a **Python Flask microservice** using the **Camelot library**.  

### 🧠 Intelligent Comparison Engine
- Analyzes **Baseline vs. Latest results**.  
- Creates structured **prompts** for AI-driven insights.  

### 🤖 AI-Driven Summaries (Google Gemini Flash 2.0)
- Gemini generates **executive summaries** of performance shifts.  
- Provides **actionable insights** from parsed results.  

### 📊 Interactive Visualization & Reporting
- **Tabular JMeter comparison** for clear metrics.  
- **Interactive bar charts** for KPIs:  
  - Average Response Time  
  - Throughput  
  - Error Rate  
- **One-click PDF export** with AI Summary, Tables, and Charts.  
- **Clean, optimized PDF layout**.  

---

## 🛠️ Technology Stack

- **Electron.js** → Desktop Application UI  
- **Node.js Backend** → JMeter Parsing & Core Logic  
- **Python Flask Microservice** → Splunk Parsing (Camelot)  
- **Google Gemini Flash 2.0** → AI Agent for Summaries  
- **Charting Libraries** → Interactive KPI Visualization  
- **PDF Export** → Professional Reports  

---

## 🖥️ System Architecture

```mermaid
flowchart TD
    A[Electron Desktop App UI] -->|File Selection| B[Node.js Backend]
    B -->|Parse JMeter JTL| C[JMeter Data Parser]
    B -->|Send Splunk Reports| D[Flask Microservice]
    D -->|Extract Tables| E[Camelot PDF/HTML Parser]
    C --> F[Comparison Engine]
    E --> F
    F -->|Generate Structured Data| G[Google Gemini Flash 2.0 AI]
    G -->|Executive Summary + Insights| H[Visualization & Report Generator]
    H -->|Interactive Charts + Tables| I[Desktop App UI]
    H -->|One-Click Export| J[Polished PDF Report]
