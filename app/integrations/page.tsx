"use client"

import { useState } from 'react';

export default function IntegrationsPage() {
  const [clickupToken, setClickupToken] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedToken, setSavedToken] = useState<string | null>(null);

  const handleSaveToken = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/integrations/clickup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: clickupToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to save token');
      }

      setSavedToken(clickupToken);
      setClickupToken('');
    } catch (error) {
      console.error('Error saving token:', error);
      alert('Failed to save ClickUp token. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-6xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Integrations</h1>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8 space-y-12">
        {/* Introduction */}
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold mb-4">Configure Integrations</h2>
          <p className="text-muted-foreground">
            Connect your PM AI Agent with external tools to streamline your workflow.
            Currently supporting ClickUp integration for direct story exports.
          </p>
        </div>

        {/* ClickUp Integration Section */}
        <div className="bg-card rounded-lg p-6 shadow-sm max-w-2xl">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <svg
                  viewBox="0 0 24 24"
                  className="w-6 h-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold">ClickUp Integration</h3>
                <p className="text-sm text-muted-foreground">
                  Connect with ClickUp to export generated user stories directly to your workspace.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="clickup-token" className="text-sm font-medium">
                  API Token
                </label>
                <input
                  id="clickup-token"
                  type="password"
                  value={clickupToken}
                  onChange={(e) => setClickupToken(e.target.value)}
                  placeholder="Enter your ClickUp API token"
                  className="w-full px-3 py-2 rounded-md border bg-background"
                />
                <p className="text-xs text-muted-foreground">
                  You can find your API token in ClickUp Settings &rarr; Apps
                </p>
              </div>

              <button
                onClick={handleSaveToken}
                disabled={!clickupToken || isSaving}
                className={`w-full px-4 py-2 rounded-md transition-colors flex items-center justify-center gap-2 ${
                  !clickupToken || isSaving
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  'Save Token'
                )}
              </button>
            </div>

            {savedToken && (
              <div className="bg-primary/10 text-primary px-4 py-3 rounded-md text-sm">
                ClickUp integration configured successfully! Your stories can now be exported to ClickUp.
              </div>
            )}

            <div className="border-t pt-6 space-y-4">
              <h4 className="font-medium">How to get your API token:</h4>
              <ol className="space-y-3 text-sm text-muted-foreground list-decimal list-inside">
                <li>Log in to your ClickUp account</li>
                <li>Go to Settings (click your avatar)</li>
                <li>Click on "Apps"</li>
                <li>Generate a new "API Token"</li>
                <li>Copy and paste the token here</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
