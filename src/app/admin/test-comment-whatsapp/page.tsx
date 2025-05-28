'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MessageSquare, Send, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function TestCommentWhatsApp() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState('');
  const [comment, setComment] = useState('This is a test comment to verify WhatsApp notifications are working correctly.');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Fetch complaints on component mount
  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const response = await fetch('/api/complaints?limit=10');
      const data = await response.json();
      if (data.complaints) {
        setComplaints(data.complaints);
        if (data.complaints.length > 0) {
          setSelectedComplaint(data.complaints[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
    }
  };

  const addComment = async () => {
    if (!selectedComplaint || !comment.trim()) {
      alert('Please select a complaint and enter a comment');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      console.log('Adding comment to complaint:', selectedComplaint);
      console.log('Comment content:', comment);

      const response = await fetch(`/api/complaints/${selectedComplaint}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: comment,
          isInternal: false
        }),
      });

      const data = await response.json();
      
      console.log('Comment API response:', data);

      if (response.ok) {
        setResult({
          success: true,
          message: 'Comment added successfully! Check server logs for WhatsApp notifications.',
          data: data
        });
        setComment(''); // Clear comment after success
      } else {
        setResult({
          success: false,
          message: data.error || 'Failed to add comment',
          data: data
        });
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      setResult({
        success: false,
        message: 'Network error: ' + error,
        data: null
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Test Comment WhatsApp Notifications</h1>
      </div>

      <div className="grid gap-6">
        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📋 Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>1.</strong> Select a complaint from the dropdown</p>
              <p><strong>2.</strong> Enter a test comment</p>
              <p><strong>3.</strong> Click "Add Comment" - this will trigger WhatsApp notifications</p>
              <p><strong>4.</strong> Check your <strong>server console logs</strong> for WhatsApp notification attempts</p>
              <p><strong>5.</strong> Check your phone for received WhatsApp messages</p>
            </div>
          </CardContent>
        </Card>

        {/* Comment Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Add Test Comment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Complaint</label>
              <Select value={selectedComplaint} onValueChange={setSelectedComplaint}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a complaint..." />
                </SelectTrigger>
                <SelectContent>
                  {complaints.map((complaint) => (
                    <SelectItem key={complaint._id} value={complaint._id}>
                      {complaint.title} (#{complaint._id.slice(-6)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                {complaints.length} complaints available
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Comment Text</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Enter your test comment here..."
                rows={4}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                This comment will trigger WhatsApp notifications to all stakeholders
              </p>
            </div>

            <Button 
              onClick={addComment}
              disabled={loading || !selectedComplaint || !comment.trim()}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding Comment & Sending WhatsApp...
                </>
              ) : (
                <>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Add Comment (Test WhatsApp)
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <Card>
            <CardContent className="pt-6">
              <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <div className="flex items-start gap-2">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <AlertDescription>
                      <div className="space-y-2">
                        <div><strong>Status:</strong> {result.success ? 'Success' : 'Error'}</div>
                        <div><strong>Message:</strong> {result.message}</div>
                        {result.data && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-sm font-medium">API Response</summary>
                            <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                              {JSON.stringify(result.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* What to Look For */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🔍 What to Look for in Server Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="bg-green-50 p-3 rounded border-l-4 border-green-400">
                <p className="font-medium text-green-800">✅ Success Pattern:</p>
                <pre className="text-xs text-green-700 mt-1 overflow-x-auto">
{`Sending WhatsApp notifications for new comment...
WhatsApp notifications queued for X recipients
=== SENDING WHATSAPP MESSAGE ===
ChatId: 923XXXXXXXXX@c.us
Response status: 200 OK
✅ WhatsApp message sent successfully`}
                </pre>
              </div>

              <div className="bg-red-50 p-3 rounded border-l-4 border-red-400">
                <p className="font-medium text-red-800">❌ Error Patterns:</p>
                <pre className="text-xs text-red-700 mt-1 overflow-x-auto">
{`❌ Error sending WhatsApp message: [error details]
WhatsApp API Error: 403 [credentials invalid]
No valid phone numbers provided for WhatsApp notification`}
                </pre>
              </div>

              <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                <p className="font-medium text-blue-800">📱 Expected WhatsApp Message:</p>
                <pre className="text-xs text-blue-700 mt-1 overflow-x-auto">
{`💬 *New Comment Added*

*ID:* #abc123
*Title:* [Complaint Title]
*Comment by:* [Your Name]
*Status:* [Complaint Status]

*Comment:*
[Your test comment]

View details: http://localhost:3000/admin/complaints/[id]`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Troubleshooting */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-amber-700">⚠️ Troubleshooting</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium">If you don't see WhatsApp logs:</h4>
                <ul className="list-disc list-inside text-gray-600 ml-2">
                  <li>Users might not have phone numbers - Run: <code className="bg-gray-100 px-1 rounded">node scripts/add-test-phone-numbers.js</code></li>
                  <li>Environment variables not loaded - Restart dev server</li>
                  <li>WhatsApp service not configured properly</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium">If logs show success but no message received:</h4>
                <ul className="list-disc list-inside text-gray-600 ml-2">
                  <li>Check WAAPI dashboard for delivery logs</li>
                  <li>Message your WAAPI number first (24-hour rule)</li>
                  <li>Try different phone number format</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium">Before testing:</h4>
                <ul className="list-disc list-inside text-gray-600 ml-2">
                  <li>Make sure you're logged in as admin/manager/employee</li>
                  <li>Ensure the selected complaint has stakeholders with phone numbers</li>
                  <li>Check that your WAAPI credentials are working</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}