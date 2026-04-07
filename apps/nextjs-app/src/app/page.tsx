import { getServerSession } from "next-auth";
import { fetchGroupsForUser } from "@/lib/agent-client";

export default async function Home() {
  const session = await getServerSession();

  let userGroups = null;
  let errorMsg = null;

  if (session?.user?.email) {
    const res = await fetchGroupsForUser(session.user.email);
    if (res.success) {
      userGroups = res.data;
    } else {
      errorMsg = res.error;
    }
  } else if (session) {
    errorMsg = "No email address provided by Identity Provider. Ensure the OIDC scope includes 'email' so we can map to Active Directory.";
  }

  return (
    <main className="min-h-screen bg-neutral-900 text-white flex items-center justify-center p-8">
      <div className="max-w-2xl w-full bg-neutral-800 rounded-2xl shadow-2xl overflow-hidden p-8 border border-neutral-700">
        <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-blue-400 to-emerald-400 text-transparent bg-clip-text">Identity Bridge</h1>
        <p className="text-neutral-400 mb-8 font-medium">Next.js to On-Premises AD synchronization.</p>

        {!session ? (
          <div className="flex flex-col items-center p-6 bg-neutral-900/50 rounded-xl border border-neutral-800">
             <h2 className="text-xl font-semibold mb-4">Not Authenticated</h2>
             <p className="text-neutral-500 mb-6 text-center max-w-sm">Please log in through your Cloud Identity Provider (OIDC) to continue.</p>
             <a href="/api/auth/signin" className="px-6 py-3 bg-blue-600 hover:bg-blue-500 transition-colors rounded-lg font-bold">
               Sign in with SSO
             </a>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-emerald-900/20 rounded-xl border border-emerald-900/40">
               <div>
                 <p className="text-sm text-emerald-400 font-semibold mb-1">Authenticated via OIDC</p>
                 <p className="text-white text-lg">{session.user?.name || session.user?.email}</p>
                 <p className="text-neutral-400 text-sm">{session.user?.email}</p>
               </div>
               <a href="/api/auth/signout" className="px-4 py-2 bg-red-600/10 text-red-400 hover:bg-red-600/20 transition-colors rounded-lg font-semibold text-sm border border-red-600/20">
                 Sign Out
               </a>
            </div>

            <div className="mt-8">
               <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                 <span className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">🏢</span> 
                 Active Directory Identity
               </h3>
               
               {errorMsg && (
                 <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 mb-4 font-mono text-sm shadow-inner">
                   Error communicating with Agent: {errorMsg}
                 </div>
               )}

               {userGroups ? (
                 <div className="space-y-4">
                   <dl className="grid grid-cols-2 gap-4">
                     <div className="p-4 bg-neutral-900/80 rounded-lg border border-neutral-800">
                       <dt className="text-neutral-500 text-xs font-bold uppercase tracking-wider mb-1">SAM Account Name</dt>
                       <dd className="font-mono text-sm text-blue-300">{userGroups.username || 'Not resolved'}</dd>
                     </div>
                     <div className="p-4 bg-neutral-900/80 rounded-lg border border-neutral-800">
                       <dt className="text-neutral-500 text-xs font-bold uppercase tracking-wider mb-1">Display Name</dt>
                       <dd className="font-mono text-sm text-emerald-300">{userGroups.name || 'Not resolved'}</dd>
                     </div>
                   </dl>
                   
                   <div className="p-4 bg-neutral-900/80 rounded-lg border border-neutral-800">
                     <h4 className="text-neutral-500 text-xs font-bold uppercase tracking-wider mb-3">Group Memberships</h4>
                     {userGroups.groups && userGroups.groups.length > 0 ? (
                       <ul className="space-y-2 font-mono text-xs max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                         {userGroups.groups.map((group: string, idx: number) => (
                           <li key={idx} className="p-2 bg-neutral-800 border border-neutral-700 rounded text-neutral-300 break-all leading-relaxed">
                             {group}
                           </li>
                         ))}
                       </ul>
                     ) : (
                       <p className="text-neutral-600 italic">No groups found in AD.</p>
                     )}
                   </div>
                 </div>
               ) : (
                 !errorMsg && (
                   <div className="p-8 text-center text-neutral-500 border border-neutral-800 rounded-lg bg-neutral-900/30 flex flex-col items-center space-y-3">
                     <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                     <p>Querying internal Agent Service for Active Directory identity...</p>
                   </div>
                 )
               )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
