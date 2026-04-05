
# Phase: Admin Dashboard Redesign

## Goals
Transform the admin dashboard from a cluttered control panel into a premium, focused operations center optimized for competition management.

## Changes

### 1. Redesign Overview Panel (`MetricsPanel`)
- **Command Center Header**: Real-time status bar showing urgent items (pending withdrawals, pending submissions, fraud alerts)
- **Streamlined Stats Grid**: 4 key metrics (Users, Revenue, Active Competitions, Pending Actions) instead of 6
- **Live Activity Feed**: Recent platform events (signups, submissions, votes, payments) in a compact timeline
- **Smart Quick Actions**: Context-aware actions that highlight urgent tasks first

### 2. Reorganize Sidebar (`AdminSidebar`)
- Reduce from 9 groups to 5 focused groups: **Operations**, **Competitions**, **Users**, **Content**, **Settings**
- Add urgent indicator dots (not just badge counts)
- Move rarely-used items (Blog, Leads, Referrals) into Settings

### 3. Improve Competition Management
- Add inline submission count + vote stats to competition cards
- Add status timeline (Created → Active → Voting → Completed)
- Integrate fraud alerts directly into competition view

### 4. Enhanced Moderation Workflow
- Add pending count badges to sidebar for submissions needing review
- Quick-approve/reject inline without opening full panel

### 5. Admin Header Bar
- Show admin name + role badge
- Add global search across users/competitions/submissions
- Real-time notification count

## Files to modify
- `src/pages/Admin.tsx` — Redesign MetricsPanel, CompetitionsPanel, header
- `src/components/admin/AdminSidebar.tsx` — Reorganize nav groups, add urgency indicators

## Files unchanged
- All existing sub-panels (UsersPanel, VotingControlsPanel, etc.) — working well already
