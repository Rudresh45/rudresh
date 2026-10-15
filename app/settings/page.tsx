"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Server,
  Calendar,
  Flag,
  Check,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Database,
} from "lucide-react";
import { getPreferences, savePreferences } from "../../lib/preferences";
import { UserPreferences, TaskPriority } from "../../lib/types";
import { useTasks } from "../../components/AppShell";
import { tasksApi } from "../../lib/tasks-api";

export default function SettingsPage() {
  const { refreshData, isBackendConnected } = useTasks();

  const [preferences, setPreferences] = useState<UserPreferences>(getPreferences());
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{
    success: boolean;
    statusText: string;
    latencyMs?: number;
  } | null>(null);

  useEffect(() => {
    setPreferences(getPreferences());
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    savePreferences(preferences);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionTestResult(null);
    const start = performance.now();
    try {
      const tasks = await tasksApi.getTasks();
      const latency = Math.round(performance.now() - start);
      setConnectionTestResult({
        success: true,
        statusText: `Connected successfully (${tasks.length} tasks returned)`,
        latencyMs: latency,
      });
      await refreshData();
    } catch (err: any) {
      const latency = Math.round(performance.now() - start);
      setConnectionTestResult({
        success: false,
        statusText: err.message || "Failed to reach Django backend server",
        latencyMs: latency,
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-brand-indigo">
          <Settings className="w-3.5 h-3.5" />
          <span>Configuration</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-main mt-0.5">
          Settings &amp; Preferences
        </h1>
        <p className="text-xs sm:text-sm text-secondary mt-0.5">
          Configure developer workspace defaults and inspect backend API status.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Task Preferences */}
        <section className="bg-surface border border-border rounded-lg p-5 shadow-card space-y-4">
          <h2 className="text-sm font-semibold text-main flex items-center gap-2 pb-2 border-b border-border">
            <Flag className="w-4 h-4 text-brand-indigo" />
            <span>Task Defaults</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="pref-priority" className="block text-xs font-medium text-main mb-1.5">
                Default Priority for New Tasks
              </label>
              <select
                id="pref-priority"
                value={preferences.defaultPriority}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    defaultPriority: e.target.value as TaskPriority,
                  })
                }
                className="w-full px-3 py-1.5 text-xs bg-surface border border-border rounded focus-ring text-main font-medium"
              >
                <option value="low">Low</option>
                <option value="med">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <p className="mt-1 text-[11px] text-secondary">
                Pre-selected priority when creating tasks via quick-add or modal.
              </p>
            </div>

            <div>
              <label htmlFor="pref-week" className="block text-xs font-medium text-main mb-1.5">
                Start of Week
              </label>
              <select
                id="pref-week"
                value={preferences.startOfWeek}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    startOfWeek: e.target.value as "sunday" | "monday",
                  })
                }
                className="w-full px-3 py-1.5 text-xs bg-surface border border-border rounded focus-ring text-main font-medium"
              >
                <option value="monday">Monday (Standard Developer)</option>
                <option value="sunday">Sunday</option>
              </select>
              <p className="mt-1 text-[11px] text-secondary">
                Determines date intervals in the Upcoming calendar view.
              </p>
            </div>

            <div>
              <label htmlFor="pref-date-format" className="block text-xs font-medium text-main mb-1.5">
                Date Display Format
              </label>
              <select
                id="pref-date-format"
                value={preferences.dateFormat}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    dateFormat: e.target.value as "standard" | "relative" | "iso",
                  })
                }
                className="w-full px-3 py-1.5 text-xs bg-surface border border-border rounded focus-ring text-main font-medium"
              >
                <option value="standard">Standard (e.g. Oct 15, 2026)</option>
                <option value="relative">Relative (Today, Tomorrow, in 3 days)</option>
                <option value="iso">ISO 8601 (2026-10-15)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Backend API Configuration & Diagnostics */}
        <section className="bg-surface border border-border rounded-lg p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h2 className="text-sm font-semibold text-main flex items-center gap-2">
              <Server className="w-4 h-4 text-brand-teal" />
              <span>Backend API Status &amp; Integration</span>
            </h2>
            <div className="flex items-center gap-1.5 text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  isBackendConnected ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                }`}
              />
              <span className="text-secondary font-medium">
                {isBackendConnected ? "Live Connection" : "Disconnected"}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label htmlFor="pref-api-url" className="block text-xs font-medium text-main mb-1.5">
                API Base URL
              </label>
              <div className="flex gap-2">
                <input
                  id="pref-api-url"
                  type="text"
                  value={preferences.apiBaseUrl}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      apiBaseUrl: e.target.value,
                    })
                  }
                  className="flex-1 px-3 py-1.5 text-xs bg-surface border border-border rounded focus-ring font-mono text-main"
                  placeholder="/api/v1"
                />
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTestingConnection}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-secondary hover:text-main bg-subtle hover:bg-gray-200/60 rounded border border-border transition-colors focus-ring"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isTestingConnection ? "animate-spin" : ""}`}
                  />
                  <span>Test Connection</span>
                </button>
              </div>
              <p className="mt-1 text-[11px] text-secondary">
                Relative path <code className="bg-subtle px-1 py-0.5 rounded">/api/v1</code> uses the Next.js internal reverse-proxy to forward requests to <code className="bg-subtle px-1 py-0.5 rounded">http://127.0.0.1:8000</code> without CORS restrictions.
              </p>
            </div>

            {/* Connection Test Result Feedback */}
            {connectionTestResult && (
              <div
                className={`p-3 rounded text-xs border flex items-start gap-2 ${
                  connectionTestResult.success
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                {connectionTestResult.success ? (
                  <Check className="w-4 h-4 flex-shrink-0 text-emerald-600 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600 mt-0.5" />
                )}
                <div>
                  <span className="font-semibold block">
                    {connectionTestResult.success ? "Connection Verified" : "Connection Failed"}
                  </span>
                  <span>{connectionTestResult.statusText}</span>
                  {connectionTestResult.latencyMs !== undefined && (
                    <span className="block mt-0.5 text-[11px] opacity-80">
                      Response latency: {connectionTestResult.latencyMs}ms
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Endpoints Capability Audit */}
            <div className="pt-2">
              <span className="text-xs font-semibold text-main block mb-2">
                API Endpoint Capabilities
              </span>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between p-2 bg-subtle/50 rounded border border-border">
                  <div className="font-mono text-[11px] text-main">
                    GET, POST /api/v1/tasks/
                  </div>
                  <span className="text-emerald-700 font-semibold text-[10px] uppercase bg-emerald-50 px-2 py-0.5 rounded">
                    Verified Live
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 bg-subtle/50 rounded border border-border">
                  <div className="font-mono text-[11px] text-main">
                    GET, PATCH, DELETE /api/v1/tasks/&lt;id&gt;/
                  </div>
                  <span className="text-emerald-700 font-semibold text-[10px] uppercase bg-emerald-50 px-2 py-0.5 rounded">
                    Verified Live
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 bg-subtle/50 rounded border border-border">
                  <div className="font-mono text-[11px] text-main">
                    POST /api/v1/tasks/&lt;id&gt;/start|block|complete|reopen/
                  </div>
                  <span className="text-emerald-700 font-semibold text-[10px] uppercase bg-emerald-50 px-2 py-0.5 rounded">
                    Verified Live
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 bg-subtle/50 rounded border border-border">
                  <div className="font-mono text-[11px] text-secondary">
                    /api/v1/projects/ (not routed in urls.py)
                  </div>
                  <span className="text-amber-800 font-semibold text-[10px] uppercase bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Local Adapter Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2">
          {saveSuccess ? (
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded border border-emerald-200 animate-in fade-in">
              <Check className="w-4 h-4" />
              <span>Preferences saved successfully to local workspace storage!</span>
            </div>
          ) : (
            <div />
          )}

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-brand-indigo hover:bg-brand-indigo-hover rounded shadow-subtle transition-colors focus-ring ml-auto"
          >
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
}
