
import React, { useState, useEffect } from 'react';
import { authService } from '../services/auth';
import { User, UserRole } from '../types';
import { Users, Plus, Shield, Trash2, Loader2, Copy, Check, AlertTriangle, CloudOff, CloudLightning, Settings, Key, Save, ExternalLink } from 'lucide-react';
import { useAuth } from './AuthContext';
import { useMockBackend } from '../services/firebase';

export const TeamSettings: React.FC = () => {
  const { organization } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isInviting, setIsInviting] = useState(false);
  
  // Form State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('OFFICER');
  const [inviteTitle, setInviteTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Invite Success State (for Mock Mode)
  const [invitedUser, setInvitedUser] = useState<User | null>(null);
  const [copied, setCopied] = useState(false);

  // Config State
  const [showConfig, setShowConfig] = useState(false);
  const [firebaseConfigJson, setFirebaseConfigJson] = useState('');
  const [geminiKey, setGeminiKey] = useState('');

  useEffect(() => {
    loadUsers();
    // Load existing config values for display
    const storedFb = localStorage.getItem('advancement_os_firebase_config');
    if (storedFb) setFirebaseConfigJson(storedFb);
    const storedGemini = localStorage.getItem('advancement_os_gemini_key');
    if (storedGemini) setGeminiKey(storedGemini);
  }, [organization?.id]);

  const loadUsers = async () => {
    if (organization?.id) {
        try {
            const fetchedUsers = await authService.getAllUsers(organization.id);
            setUsers(fetchedUsers);
        } catch (error) {
            console.error("Failed to load users:", error);
        }
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newUser = await authService.inviteUser(inviteEmail, inviteRole, inviteName, inviteTitle);
      await loadUsers();
      
      if (useMockBackend) {
        // In mock mode, don't close modal, show credentials instead
        setInvitedUser(newUser);
      } else {
        setIsInviting(false);
        resetForm();
      }
    } catch (error) {
      alert('Failed to invite user. Email might already exist.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
      setInviteEmail('');
      setInviteName('');
      setInviteRole('OFFICER');
      setInviteTitle('');
      setInvitedUser(null);
      setCopied(false);
  };

  const handleRemove = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this team member?')) {
        await authService.removeUser(id);
        await loadUsers();
    }
  };

  const copyCredentials = () => {
    const text = `You have been invited to AdvancementOS.\nLogin Email: ${invitedUser?.email}\nPassword: password`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveConfig = () => {
     if (firebaseConfigJson) {
         try {
             // Validate JSON
             JSON.parse(firebaseConfigJson);
             localStorage.setItem('advancement_os_firebase_config', firebaseConfigJson);
         } catch (e) {
             alert("Invalid Firebase Config JSON");
             return;
         }
     }
     if (geminiKey) {
         localStorage.setItem('advancement_os_gemini_key', geminiKey);
     }
     alert("Configuration Saved. The application will now reload to apply changes.");
     window.location.reload();
  };

  const handleClearConfig = () => {
      if (window.confirm("This will clear your cloud connection settings and return to Mock Mode. Continue?")) {
          localStorage.removeItem('advancement_os_firebase_config');
          localStorage.removeItem('advancement_os_gemini_key');
          window.location.reload();
      }
  };

  return (
    <div className="flex-1 bg-slate-50 h-full flex flex-col overflow-hidden">
       {/* Header */}
       <div className="bg-white border-b border-slate-200 px-8 py-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              Team Management
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wide border border-slate-200">Admin Console</span>
            </h1>
            <p className="text-slate-500 mt-1">Manage access, roles, and system configuration.</p>
          </div>
          <div className="flex gap-2">
            <button 
                onClick={() => setShowConfig(!showConfig)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm border ${showConfig ? 'bg-slate-200 text-slate-800 border-slate-300' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
            >
                <Settings className="w-4 h-4" />
                System Config
            </button>
            <button 
                onClick={() => setIsInviting(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
            >
                <Plus className="w-4 h-4" />
                Invite Member
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 overflow-y-auto space-y-8">
        
        {/* System Configuration Panel */}
        {showConfig && (
             <div className="bg-white rounded-xl border border-slate-300 shadow-lg animate-in fade-in slide-in-from-top-4 duration-300 overflow-hidden">
                 <div className="p-6 bg-slate-900 text-white border-b border-slate-800">
                     <h3 className="text-lg font-bold flex items-center gap-2">
                         <CloudLightning className="w-5 h-5 text-indigo-400" />
                         Cloud Connection Settings
                     </h3>
                     <p className="text-slate-400 text-sm mt-1">
                         Connect your own Google Cloud Project to enable production features (Auth, Database, AI).
                     </p>
                 </div>
                 <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                     <div>
                         <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                             <Key className="w-4 h-4 text-indigo-600" />
                             Gemini API Key
                         </label>
                         <input 
                            type="password"
                            value={geminiKey}
                            onChange={(e) => setGeminiKey(e.target.value)}
                            className="w-full p-3 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="AIzaSy..."
                         />
                         <p className="text-xs text-slate-500 mt-2">
                             Required for the Agent Fleet to function. Get one at <a href="https://aistudio.google.com" target="_blank" className="text-indigo-600 hover:underline">aistudio.google.com</a>.
                         </p>
                     </div>
                     <div>
                         <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                             <Settings className="w-4 h-4 text-indigo-600" />
                             Firebase Config JSON
                         </label>
                         <textarea 
                            value={firebaseConfigJson}
                            onChange={(e) => setFirebaseConfigJson(e.target.value)}
                            className="w-full p-3 border border-slate-200 rounded-lg text-xs font-mono h-32 focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder='{"apiKey": "...", "authDomain": "...", "projectId": "..."}'
                         />
                         <div className="text-xs text-slate-500 mt-3 space-y-1">
                             <p className="font-semibold text-slate-700">How to get this:</p>
                             <ol className="list-decimal pl-4 space-y-1">
                                 <li>Go to <a href="https://console.firebase.google.com" target="_blank" className="text-indigo-600 hover:underline inline-flex items-center gap-0.5">Firebase Console <ExternalLink className="w-3 h-3" /></a> and create a project.</li>
                                 <li>Enable <strong>Authentication</strong> (Email/Password) and <strong>Firestore Database</strong>.</li>
                                 <li>Go to Project Settings {'>'} General {'>'} Your Apps {'>'} Web App.</li>
                                 <li>Copy the object between the curly braces <code>{'{ ... }'}</code>.</li>
                             </ol>
                         </div>
                     </div>
                 </div>
                 <div className="px-8 pb-8 pt-0 flex justify-end gap-3">
                     <button 
                        onClick={handleClearConfig}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
                     >
                         Reset to Default
                     </button>
                     <button 
                        onClick={handleSaveConfig}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                     >
                         <Save className="w-4 h-4" />
                         Save & Reload
                     </button>
                 </div>
             </div>
        )}

        {/* Invite Form Modal Area */}
        {isInviting && (
            <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 text-lg">Invite New Team Member</h3>
                        <button onClick={() => { setIsInviting(false); resetForm(); }} className="text-slate-400 hover:text-slate-600">
                            Cancel
                        </button>
                    </div>
                    
                    {invitedUser && useMockBackend ? (
                        <div className="p-6">
                             <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-start gap-3">
                                <div className="p-1 bg-green-100 rounded-full text-green-600 mt-0.5">
                                    <Check className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-green-800 text-sm">Account Created Locally</h4>
                                    <p className="text-green-700 text-xs mt-1">
                                        Since you are in Simulation Mode, an email cannot be sent. Share these details with {invitedUser.name} manually.
                                    </p>
                                </div>
                             </div>

                             <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                    <span className="text-xs font-bold text-slate-500 uppercase">Login Email</span>
                                    <span className="text-sm font-mono text-slate-800 select-all">{invitedUser.email}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-500 uppercase">Temporary Password</span>
                                    <span className="text-sm font-mono text-slate-800 select-all">password</span>
                                </div>
                             </div>

                             <div className="mt-6 flex gap-3">
                                <button 
                                    onClick={copyCredentials}
                                    className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 hover:border-indigo-500 hover:text-indigo-600 text-slate-700 py-2.5 rounded-lg font-medium transition-colors"
                                >
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    {copied ? 'Copied!' : 'Copy Credentials'}
                                </button>
                                <button 
                                    onClick={() => { setIsInviting(false); resetForm(); }}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-medium transition-colors"
                                >
                                    Done
                                </button>
                             </div>
                        </div>
                    ) : (
                        <form onSubmit={handleInvite} className="p-6 grid grid-cols-2 gap-4">
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                                <input required value={inviteName} onChange={e => setInviteName(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Jane Smith" />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Job Title</label>
                                <input required value={inviteTitle} onChange={e => setInviteTitle(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Director of Giving" />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                                <input required type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="jane@university.edu" />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Role Access</label>
                                <select value={inviteRole} onChange={e => setInviteRole(e.target.value as UserRole)} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                    <option value="ADMIN">Admin (Full Access)</option>
                                    <option value="OFFICER">Officer (Standard)</option>
                                    <option value="VIEWER">Viewer (Read Only)</option>
                                </select>
                            </div>
                            <div className="col-span-2 flex justify-end mt-4">
                                <button type="submit" disabled={isSubmitting} className="bg-slate-900 hover:bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Send Invitation
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        )}

        {/* Connection Status Banner */}
        {useMockBackend && !showConfig && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-4">
                <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                    <CloudOff className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-bold text-amber-800 text-sm">Running in Local Simulation Mode</h3>
                    <p className="text-amber-700 text-xs mt-1 mb-3 max-w-3xl leading-relaxed">
                        You are currently using a local, browser-based database. 
                        <strong> Data created here will NOT be visible to other team members on different devices.</strong> 
                    </p>
                    <button 
                        onClick={() => setShowConfig(true)}
                        className="text-xs font-bold text-amber-700 hover:text-amber-900 hover:underline"
                    >
                        Click "System Config" to connect real Google Cloud keys →
                    </button>
                </div>
            </div>
        )}
        
        {!useMockBackend && (
             <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-4">
                <div className="p-2 bg-green-100 rounded-lg text-green-600">
                    <CloudLightning className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-bold text-green-800 text-sm">Connected to Google Cloud</h3>
                    <p className="text-green-700 text-xs mt-1">
                        Your application is synced in real-time. All team members will see CRM updates instantly.
                    </p>
                </div>
             </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Member</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full bg-slate-100" />
                      <div>
                        <div className="font-semibold text-slate-900">{user.name}</div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                        <Shield className={`w-4 h-4 ${
                            user.role === 'ADMIN' ? 'text-indigo-600' : 
                            user.role === 'OFFICER' ? 'text-blue-500' : 'text-slate-400'
                        }`} />
                        <span className="text-sm font-medium text-slate-700">
                            {user.role === 'ADMIN' ? 'Administrator' : 
                             user.role === 'OFFICER' ? 'Advancement Officer' : 'Viewer'}
                        </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{user.title}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        Active
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {user.role !== 'ADMIN' && (
                        <button onClick={() => handleRemove(user.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
