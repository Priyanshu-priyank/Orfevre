import React, { useState, useEffect } from 'react';
import { ShieldCheck, MapPin, PlusCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getGigs, getMyApplications, applyForGig, getUser, getWorkHistory, uploadWorkEvidence } from '../api';
import LiveVerificationModal from '../components/LiveVerificationModal';

const Profile = () => {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState('gigs');
  const [gigs, setGigs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applyingGig, setApplyingGig] = useState(null);
  const [showAppsModal, setShowAppsModal] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({});
  
  // Work History Feed & Upload State
  const [workHistory, setWorkHistory] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [workDescription, setWorkDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setLoading(true);
    
    // Fetch user details
    if (user?.id) {
      getUser(user.id).then(setUserData).catch(console.error);
      getMyApplications(user.id).then(data => setApplications(data.applications || [])).catch(console.error);
      getWorkHistory(user.id).then(data => setWorkHistory(data.entries || [])).catch(console.error);
    }
    
    // Fetch gigs for recommendations
    getGigs().then(data => setGigs(data.gigs || [])).catch(console.error).finally(() => setLoading(false));
  }, [user]);

  // Derived state
  const appliedGigIds = new Set(applications.map(a => a.gig_id));
  const recommendedGigs = gigs.filter(g => g.status === 'open' && !appliedGigIds.has(g.id)).slice(0, 3);
  
  const pendingApps = applications.filter(a => a.status === 'pending');
  const hiredApps = applications.filter(a => a.status === 'accepted');
  const cancelledApps = applications.filter(a => a.status === 'auto_cancelled');

  const handleApplySuccess = async (gig) => {
    if (user?.id) {
      try {
        await applyForGig(gig.id, user.id);
        // Refresh applications
        const data = await getMyApplications(user.id);
        setApplications(data.applications || []);
      } catch (e) {
        alert("Failed to apply. " + e.message);
      }
    }
    setApplyingGig(null);
  };

  const getStatusPill = (status) => {
    if (status === 'accepted') return <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Hired</span>;
    if (status === 'pending') return <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1"><Clock className="w-3 h-3"/> Pending</span>;
    if (status === 'auto_cancelled') return <span className="bg-gray-100 text-gray-500 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1"><XCircle className="w-3 h-3"/> Cancelled</span>;
    return <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span> Open</span>;
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) return alert("Please select a photo.");
    
    setIsUploading(true);
    try {
      // Pass trade and claimed level from userData, or default
      const trade = userData?.trade || 'General Worker';
      const claimedLevel = userData?.certTier || 'bronze';
      
      const res = await uploadWorkEvidence(user.id, trade, claimedLevel, workDescription, uploadFile);
      alert(res.message || "Work verified and posted!");
      
      // Refresh feed
      const historyData = await getWorkHistory(user.id);
      setWorkHistory(historyData.entries || []);
      
      // Reset Modal
      setShowUploadModal(false);
      setUploadFile(null);
      setWorkDescription('');
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-gray-500">Loading Profile...</div>;

  return (
    <div className="pb-20 max-w-5xl mx-auto px-4 sm:px-6 mt-4">
      
      {/* Verification Modal */}
      {applyingGig && (
        <LiveVerificationModal
          gig={applyingGig}
          userId={user?.id}
          onClose={() => setApplyingGig(null)}
          onSuccess={handleApplySuccess}
        />
      )}

      {/* --- Profile Header (Card) --- */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 mb-6">
        
        {/* Top Banner */}
        <div className="h-40 bg-gradient-to-r from-[#4F7942] to-[#809B53] relative overflow-hidden">
          {/* Abstract circles pattern */}
          <div className="absolute top-0 left-0 w-full h-full opacity-30">
            <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-white/20"></div>
            <div className="absolute top-10 left-1/3 w-80 h-80 rounded-full bg-white/10"></div>
            <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-black/10"></div>
          </div>
          
          {/* Trust Badge */}
          <div className="absolute top-4 left-4 bg-[#00875a] text-white px-4 py-1.5 rounded-full font-bold shadow flex items-center gap-1">
            <span className="text-yellow-300">⭐</span> Trust: {userData?.trustScore ?? 0}
          </div>
          
          {/* Top Right Logo Watermark */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5 text-white/80">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
            <span className="text-sm font-bold opacity-80">YuvaShakti</span>
          </div>
        </div>

        {/* Profile Info Section */}
        <div className="px-6 relative pb-8">
          {/* Avatar (Overlapping) */}
          <div className="absolute -top-12 left-6 w-24 h-24 bg-[#1F2937] rounded-full border-4 border-white flex items-center justify-center text-3xl text-white font-bold shadow-sm z-10">
            {userData?.name ? userData.name.split(' ').map(n=>n[0]).join('') : 'U'}
            {/* Online Status Dot */}
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-white rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-green-500 rounded-full border border-white"></div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end pt-4 gap-2 flex-wrap">
            <button onClick={() => setShowAppsModal(true)} className="px-4 py-2 rounded-full border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 shadow-sm">
              <span className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{applications.length}</span> Applications
            </button>
            <button onClick={() => { setEditForm(userData || {}); setIsEditingProfile(true); }} className="px-4 py-2 rounded-full border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 shadow-sm">
              ✏️ Edit
            </button>
            <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert("Profile link copied to clipboard! (Wait for WhatsApp integration soon)"); }} className="px-4 py-2 rounded-full bg-[#1b4332] text-sm font-bold text-white hover:bg-[#153426] flex items-center gap-1.5 shadow-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
              Share
            </button>
          </div>

          {/* Text Info */}
          <div className="mt-4">
            <h1 className="text-2xl font-extrabold text-[#1D1C1D]">{userData?.name || 'User'}</h1>
            
            <h2 className="text-gray-700 font-semibold mt-1">{userData?.trade || 'Trade not set'}</h2>

            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium mt-1 mb-3">
              <MapPin className="w-4 h-4" /> {userData?.district || 'Hubli'}, Karnataka 
              <span className="text-green-600 font-bold ml-2">• Available</span>
            </div>

            {userData?.bio && (
              <div className="mt-5 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                <p className="text-sm text-gray-700 font-medium leading-relaxed">
                  {userData.bio}
                </p>
              </div>
            )}
          </div>

          {/* Stats Row */}
          <div className="flex bg-gray-50 rounded-2xl p-4 mt-6 border border-gray-100">
            <div className="flex-1 text-center border-r border-gray-200">
              <div className="text-2xl font-extrabold text-[#1D1C1D]">{hiredApps.length}</div>
              <div className="text-xs font-bold text-gray-500 uppercase mt-0.5">Gigs Done</div>
            </div>
            <div className="flex-1 text-center border-r border-gray-200">
              <div className="text-2xl font-extrabold text-[#1D1C1D]">{userData?.skillTokens ?? 0}</div>
              <div className="text-xs font-bold text-gray-500 uppercase mt-0.5">Skill Tokens</div>
            </div>
            <div className="flex-1 text-center">
              <div className="text-2xl font-extrabold text-[#1D1C1D]">{userData?.networkSize ?? 0}</div>
              <div className="text-xs font-bold text-gray-500 uppercase mt-0.5">Network</div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Tabs Section --- */}
      <div className="flex bg-gray-50 rounded-full p-1.5 mb-6 shadow-inner border border-gray-200">
        <button onClick={() => setActiveTab('gigs')} className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-full transition-all ${activeTab === 'gigs' ? 'bg-[#1a1727] text-white shadow-md' : 'text-gray-500 hover:bg-gray-200/50'}`}>
          <span className="font-bold text-sm">Gigs</span>
        </button>
        <button onClick={() => setActiveTab('posts')} className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-full transition-all ${activeTab === 'posts' ? 'bg-[#1a1727] text-white shadow-md' : 'text-gray-500 hover:bg-gray-200/50'}`}>
          <span className="font-bold text-sm">Posts</span>
        </button>
      </div>

      {/* --- Tab Content --- */}
      
      {activeTab === 'gigs' && (
        <div className="space-y-6">
          {/* Header Row */}
          <div className="flex items-center justify-between px-2">
            <div>
              <h2 className="text-xl font-extrabold text-[#1D1C1D]">Gig Matches</h2>
            </div>
            <button className="bg-[#F4A935] hover:bg-[#d9962f] text-white px-4 py-2 rounded-full font-bold text-sm shadow-sm flex items-center gap-1.5 transition-colors">
              🪄 Find gigs
            </button>
          </div>

          {/* Active / Hired Gigs */}
          {hiredApps.length > 0 && (
            <div className="mb-6">
              <h3 className="font-bold text-[#1D1C1D] text-lg mb-3 px-2">Active Gigs</h3>
              <div className="space-y-4">
                {hiredApps.map(app => (
                  <div key={app.id} className="bg-white rounded-[20px] p-5 shadow-sm border-2 border-[#00875a] flex flex-col gap-4 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00875a]"></div>
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-2xl border border-green-100">💼</div>
                        <div>
                          <h3 className="font-bold text-[#1D1C1D] text-lg leading-tight">{app.gig?.title || 'Active Gig'}</h3>
                          <div className="flex items-center gap-3 text-sm text-gray-500 font-medium mt-1">
                        <span className="flex items-center gap-1"><span className="text-gray-400">👤</span> {app.gig?.merchant_uid || app.gig?.vendorId || 'Vendor'}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> Hired on {new Date(app.updated_at || app.applied_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      {getStatusPill(app.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Canva Style Cards (Matches) */}
          <div className="space-y-4">
            {recommendedGigs.length === 0 ? (
               <div className="bg-white rounded-2xl p-6 text-center text-gray-500 shadow-sm border border-gray-100">No matches found right now.</div>
            ) : recommendedGigs.map((gig, idx) => (
              <div key={gig.id} className={`bg-white rounded-[20px] p-5 shadow-sm border-2 flex flex-col gap-4 relative overflow-hidden transition-all hover:shadow-md ${idx === 0 ? 'border-[#F4A935]' : 'border-gray-100'}`}>
                {/* Left Colored Accent Bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${idx === 0 ? 'bg-[#F4A935]' : 'bg-transparent'}`}></div>
                
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl border border-blue-100">💻</div>
                    <div>
                      <h3 className="font-bold text-[#1D1C1D] text-lg leading-tight">{gig.title}</h3>
                      <div className="flex items-center gap-3 text-sm text-gray-500 font-medium mt-1">
                        <span className="flex items-center gap-1"><span className="text-gray-400">👤</span> {gig.merchant_uid || gig.vendorId || 'Vendor'}</span>
                        {gig.district && (
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {gig.district}</span>
                        )}
                        {gig.created_at && (
                          <span>{new Date(gig.created_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {getStatusPill(gig.status || 'open')}
                </div>

                <div className="flex items-center justify-between mt-2 pt-2">
                  <div className="text-xl font-extrabold text-[#00875a]">₹{gig.budget || '800'}</div>
                  <button onClick={() => setApplyingGig(gig)} className="bg-[#F4A935] hover:bg-[#d9962f] text-white font-bold py-2 px-6 rounded-full text-sm shadow-sm transition-colors flex items-center gap-1.5">
                    Accept &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'posts' && (
         <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <div>
                <h2 className="text-xl font-extrabold text-[#1D1C1D]">Proof of Work</h2>
              </div>
              <button 
                onClick={() => setShowUploadModal(true)}
                className="bg-[#007B55] hover:bg-[#006243] text-white px-4 py-2 rounded-full font-bold text-sm shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <PlusCircle className="w-4 h-4"/> Add Photo
              </button>
            </div>

            {/* Feed */}
            <div className="space-y-6">
              {workHistory.length === 0 ? (
                 <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
                   <div className="text-6xl mb-4">📷</div>
                   <h3 className="text-xl font-bold text-gray-900">Portfolio is empty</h3>
                   <p className="text-gray-500 mt-2">Upload photos of your completed jobs to build your AI-verified portfolio.</p>
                 </div>
              ) : (
                 workHistory.map(entry => (
                   <div key={entry.entryId} className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-gray-200">
                     <div className="p-4 flex items-center gap-3 border-b border-gray-50">
                       <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-700">
                         {userData?.name ? userData.name[0] : 'U'}
                       </div>
                       <div>
                         <h4 className="font-bold text-[#1D1C1D] leading-tight">{userData?.name || 'User'}</h4>
                         <p className="text-xs text-gray-500">{new Date(entry.submittedAt).toLocaleDateString()}</p>
                       </div>
                     </div>
                     
                     {/* Post Image */}
                     <div className="w-full h-64 bg-gray-100 border-y border-gray-50 overflow-hidden relative">
                       {entry.file_url ? (
                         <img src={entry.file_url} alt="Proof of Work" className="w-full h-full object-cover" />
                       ) : (
                         <img src={`https://picsum.photos/seed/${entry.entryId}/800/600`} alt="Proof of Work" className="w-full h-full object-cover" />
                       )}
                     </div>
                     
                     <div className="p-4">
                       <div className="flex items-center gap-2 mb-3">
                         {entry.aiScore >= 70 ? (
                           <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                             <ShieldCheck className="w-3 h-3"/> AI Verified ({entry.aiScore})
                           </span>
                         ) : (
                           <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full">
                             AI Score: {entry.aiScore}
                           </span>
                         )}
                         <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                           {entry.aiComplexity} • {entry.trade || userData?.trade || 'Skill'}
                         </span>
                       </div>
                       <p className="text-sm text-gray-800 font-medium mb-1"><span className="font-bold mr-1">{userData?.name || 'User'}</span> {entry.workDescription}</p>
                       {entry.geoValidation?.work_location && (
                         <p className="text-xs text-gray-500 flex items-center gap-1 mt-2">
                           <MapPin className="w-3 h-3"/> {entry.geoValidation.work_location}
                         </p>
                       )}
                     </div>
                   </div>
                 ))
              )}
            </div>
         </div>
      )}

      {/* Manual Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-extrabold text-lg">Upload Work Photo</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-gray-800">
                <XCircle className="w-6 h-6"/>
              </button>
            </div>
            
            <form onSubmit={handleUploadSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Photo Evidence</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setUploadFile(e.target.files[0])}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                <textarea 
                  value={workDescription}
                  onChange={(e) => setWorkDescription(e.target.value)}
                  placeholder="What task did you complete?"
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#007B55] outline-none"
                  rows="3"
                  required
                ></textarea>
              </div>

              <div className="bg-yellow-50 text-yellow-800 text-xs p-3 rounded-xl flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0"/>
                <p><strong>Testing Mode:</strong> Geolocation validation has been bypassed per user request. The AI will strictly evaluate the skill complexity of your photo.</p>
              </div>
              
              <button 
                type="submit" 
                disabled={isUploading}
                className="w-full bg-[#1a1727] text-white rounded-xl py-3.5 font-bold mt-2 disabled:bg-gray-400 transition-colors"
              >
                {isUploading ? 'Analyzing via AI...' : 'Submit Evidence'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Applications Modal */}
      {showAppsModal && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="font-extrabold text-lg">My Applications</h3>
              <button onClick={() => setShowAppsModal(false)} className="text-gray-400 hover:text-gray-800">
                <XCircle className="w-6 h-6"/>
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto space-y-4">
              {applications.length === 0 ? (
                 <div className="bg-white rounded-2xl p-6 text-center text-gray-500 border border-gray-100">No applications yet.</div>
              ) : applications.map((app) => (
                <div key={app.id} className={`bg-white rounded-[20px] p-5 shadow-sm border-2 flex flex-col gap-4 relative overflow-hidden transition-all ${app.status === 'accepted' ? 'border-[#00875a]' : 'border-gray-100'}`}>
                  {app.status === 'accepted' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00875a]"></div>}
                  
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-2xl border border-gray-200">💼</div>
                      <div>
                        <h3 className="font-bold text-[#1D1C1D] text-lg leading-tight">{app.gig?.title || 'Gig Application'}</h3>
                        <p className="text-xs text-gray-400 mb-2">Applied on {new Date(app.applied_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {getStatusPill(app.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- Edit Profile Modal --- */}
      {isEditingProfile && (
        <div className="fixed inset-0 bg-[#1D1C1D]/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-extrabold text-[#1D1C1D] mb-6">Edit Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                <input type="text" value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00875a] focus:border-transparent outline-none font-medium" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Primary Trade/Skill</label>
                <input type="text" value={editForm.trade || ''} onChange={e => setEditForm({...editForm, trade: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00875a] focus:border-transparent outline-none font-medium" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">District</label>
                <input type="text" value={editForm.district || ''} onChange={e => setEditForm({...editForm, district: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00875a] focus:border-transparent outline-none font-medium" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Bio</label>
                <textarea value={editForm.bio || ''} onChange={e => setEditForm({...editForm, bio: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00875a] focus:border-transparent outline-none min-h-[100px] font-medium"></textarea>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setIsEditingProfile(false)} className="px-5 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors">Cancel</button>
              <button 
                onClick={async () => {
                  try {
                    const updated = await updateUser(user.id, editForm);
                    setUserData(updated);
                    setIsEditingProfile(false);
                  } catch (e) { console.error("Failed to update user", e); }
                }} 
                className="px-6 py-2.5 rounded-xl font-bold bg-[#00875a] text-white hover:bg-[#006b47] shadow-md transition-all active:scale-95"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Profile;
