// src/components/ErrorBoundary.tsx
// ProAnaliz AI - Crash-Resistant Application Error Boundary
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ProAnaliz AI Error Boundary caught an error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    try {
      localStorage.removeItem('proanaliz_active_team_theme');
      localStorage.removeItem('proanaliz_view_mode');
    } catch {}
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <h2 className="text-xl font-black text-white">Bir Şeyler Beklenmedik Gitti</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Uygulama çalışırken beklenmedik bir durumla karşılaştı. Verileriniz güvende; sayfayı yenileyerek analizlerinize devam edebilirsiniz.
            </p>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-rose-400 text-left overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                <RefreshCw className="w-4 h-4 stroke-[3]" />
                <span>Sayfayı Yenile</span>
              </button>

              <button
                onClick={this.handleReset}
                className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer border border-slate-700"
              >
                <Home className="w-4 h-4" />
                <span>Sıfırla ve Başlat</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

