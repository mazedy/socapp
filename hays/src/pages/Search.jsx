import { useState } from 'react';
import UserCard from '@/components/UserCard';
import { useToast } from '@/utils/Toast';
import { searchUsers } from '@/api/users';

export default function Search() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const onSearch = async (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    try {
      const { data } = await searchUsers(q);
      setResults(data);
    } catch (e) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen p-6 flex flex-col items-center bg-gradient-to-br from-orca-pale to-orca-soft/50 relative overflow-hidden"
    >
      {/* Cute moving clouds */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="animate-cloud absolute w-72 h-36 bg-orca-soft/40 rounded-full opacity-50 top-10 left-[-100px]"></div>
        <div className="animate-cloud animation-delay-5 w-56 h-28 bg-orca-soft/30 rounded-full opacity-40 top-32 left-[-150px]"></div>
        <div className="animate-cloud animation-delay-10 absolute w-80 h-40 bg-orca-soft/20 rounded-full opacity-30 top-52 left-[-200px]"></div>
        <div className="animate-cloud absolute w-72 h-36 bg-orca-soft/40 rounded-full opacity-50 top-10 left-[-100px]"></div>
        <div className="animate-cloud animation-delay-5 absolute w-56 h-28 bg-orca-soft/30 rounded-full opacity-40 top-32 left-[-150px]"></div>
        <div className="animate-cloud animation-delay-10 absolute w-80 h-40 bg-orca-soft/20 rounded-full opacity-30 top-52 left-[-300px]"></div>
        <div className="animate-cloud absolute w-72 h-36 bg-orca-soft/40 rounded-full opacity-50 top-10 left-[-100px]"></div>
        <div className="animate-cloud animation-delay-5 absolute w-56 h-28 bg-orca-soft/30 rounded-full opacity-40 top-32 left-[-150px]"></div>
        <div className="animate-cloud animation-delay-10 absolute w-80 h-40 bg-orca-soft/20 rounded-full opacity-30 top-52 left-[-50px]"></div>
      </div>

      <h1 className="text-4xl font-bold mb-6 text-orca-navy z-10">Search Users</h1>
      <form onSubmit={onSearch} className="flex gap-2 mb-6 w-full max-w-xl z-10">
        <input
          className="flex-1 border border-orca-soft rounded-lg px-4 py-2 text-orca-navy focus:outline-none focus:ring-2 focus:ring-orca-ocean/50 bg-white/90 backdrop-blur-sm shadow-sm"
          placeholder="Search users..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="bg-orca-navy hover:bg-orca-ocean text-white px-6 py-2 rounded-lg transition-colors duration-200 font-medium shadow-md">
          Search
        </button>
      </form>

      {loading ? (
        <div className="text-orca-navy/80 z-10 flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-orca-soft border-t-orca-navy rounded-full animate-spin"></div>
          Searching...
        </div>
      ) : (
        <div className="grid gap-3 w-full max-w-xl z-10">
          {results.map((u) => (
            <UserCard key={u.id} user={u} />
          ))}
        </div>
      )}

      {/* Cloud animation CSS */}
      <style>
        {`
          @keyframes cloudMove {
            0% { transform: translateX(0); }
            100% { transform: translateX(120vw); }
          }
          .animate-cloud {
            animation: cloudMove 60s linear infinite;
          }
          .animation-delay-5 { animation-delay: 5s; }
          .animation-delay-10 { animation-delay: 10s; }
        `}
      </style>
    </div>
  );
}
