# Manager Complaint Detail Page

## Overview
The manager complaint detail page (`/manager/complaints/[id]`) provides comprehensive functionality for managers to view, manage, and track individual complaints.

## Features

### 📋 Complaint Overview
- **Full complaint details** with title, description, error information
- **Client information** with contact details
- **Current assignee** and assignment history
- **Department and nature type** classification
- **Real-time status** with color-coded badges
- **Manager remarks** with inline editing capability

### 📎 Attachment Management
- **View attachments** with file type and size information
- **Download attachments** individually
- **Open attachments** in new tabs for preview
- **File metadata** including upload date and uploader

### 📈 Activity Tracking
- **Complete activity history** with timestamps
- **Status change tracking** with responsible users
- **Assignment history** showing all transfers
- **Notes and comments** for each activity

### ⚙️ Management Actions

#### Status Management
- **Update complaint status** through dropdown selection
- **Add notes** for status changes
- **Quick action buttons** for common status updates:
  - Mark as Closed
  - Start Working (New → In Progress)
  - Mark as Completed (In Progress → Completed)

#### Assignment Management
- **Reassign complaints** to team members
- **Department-based filtering** of assignees
- **Cross-department assignment** to other managers
- **Assignment notes** for context

#### Remarks Management
- **Add/edit manager remarks** with inline editing
- **Rich text support** for detailed comments
- **Auto-save functionality** with confirmation

### 🎯 Quick Information Panel
- **Client details** with contact information
- **Current assignee** with role and department
- **Department information** 
- **Nature type** with description
- **Timeline information** (created/updated dates)

## Navigation
- **Breadcrumb navigation** back to complaints list
- **Refresh functionality** to update data
- **Quick actions sidebar** for common operations

## URL Structure
```
/manager/complaints/[complaintId]
```

Example: `http://localhost:3000/manager/complaints/68318dc3180c0ee66b47c2bc`

## Permissions
- **Manager access only** to complaints in their department
- **Cross-department visibility** for reassignment purposes
- **Admin override** capabilities (inherited from role)

## Technical Implementation

### Key Components
- **React hooks** for state management
- **Next.js** dynamic routing
- **Real-time updates** through API calls
- **Responsive design** with Tailwind CSS
- **Toast notifications** for user feedback

### API Endpoints Used
- `GET /api/complaints/[id]` - Fetch complaint details
- `PUT /api/complaints/[id]` - Update complaint (remarks)
- `PATCH /api/complaints/[id]/status` - Update status
- `PATCH /api/complaints/[id]/assign` - Reassign complaint
- `GET /api/users/team` - Fetch team members

### State Management
- **Complaint data** with history
- **Team members** for assignment
- **Form states** for updates
- **Loading states** for UX
- **Error handling** with user feedback

## Usage Instructions

### Viewing Complaint Details
1. Navigate from the complaints list using "View Details"
2. Review all complaint information in the main panel
3. Check attachments and download if needed
4. Review activity history for context

### Updating Status
1. Click the "Status" tab in the Actions panel
2. Select new status from dropdown
3. Add optional notes for context
4. Click "Update Status"

### Reassigning Complaints
1. Click the "Assign" tab in the Actions panel
2. Select team member from filtered list
3. Add assignment notes if needed
4. Click "Assign Complaint"

### Managing Remarks
1. Click the edit icon next to "Manager Remarks"
2. Add or modify remarks in the text area
3. Click "Save" to confirm changes
4. Use "Cancel" to discard changes

### Quick Actions
- Use sidebar quick action buttons for common operations
- "Mark as Closed" for resolved complaints
- "Start Working" to begin processing
- "Mark as Completed" when work is finished

## Error Handling
- **Network errors** with retry options
- **Permission errors** with clear messaging
- **Validation errors** with field-specific feedback
- **Not found errors** with navigation back to list

## Responsive Design
- **Mobile-friendly** layout with collapsible sections
- **Tablet optimization** with adjusted grid layouts
- **Desktop experience** with full sidebar and panels
- **Touch-friendly** interface elements

## Future Enhancements
- **Comment system** for team collaboration
- **File upload** for additional attachments
- **Email notifications** for status changes
- **Export functionality** for reporting
- **Bulk operations** for similar complaints
