
import React, { useState } from 'react';
import { Bell, Check, Trash2, Siren, MessageCircle, Trophy, Calendar, Info, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Mock Notifications Data
const MOCK_NOTIFICATIONS = [
    { id: 'n1', type: 'SYSTEM_ALERT', title: 'Sharp Money Alert', message: 'Heavy volume detected on Chiefs -3.5 (92% Cash)', time: '10m ago', read: false },
    { id: 'n2', type: 'GAME_UPDATE', title: 'Goal! Arsenal 1-0', message: 'Bukayo Saka scores in the 12th minute.', time: '1h ago', read: false },
    { id: 'n3', type: 'SOCIAL', title: 'New Reply', message: 'NaijaBetKing replied to your comment in Gunners Talk.', time: '2h ago', read: true },
    { id: 'n4', type: 'PROMO', title: 'Sheena+ Offer', message: 'Get 50% off your first month of Pro access.', time: '1d ago', read: true },
    { id: 'n5', type: 'SYSTEM_ALERT', title: 'Line Movement', message: 'Lakers line shifted from -4.5 to -6.0.', time: '1d ago', read: true },
];

export const NotificationsPage: React.FC = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
    const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const clearAll = () => {
        if(confirm("Clear all notifications?")) {
            setNotifications([]);
        }
    };

    const deleteNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const getIcon = (type: string) => {
        switch(type) {
            case 'SYSTEM_ALERT': return <Siren size={18} className="text-red-500" />;
            case 'GAME_UPDATE': return <Trophy size={18} className="text-yellow-500" />;
            case 'SOCIAL': return <MessageCircle size={18} className="text-blue-500" />;
            case 'PROMO': return <Calendar size={18} className="text-green-500" />;
            default: return <Info size={18} className="text-gray-500" />;
        }
    };

    const filteredNotifications = filter === 'ALL' 
        ? notifications 
        : notifications.filter(n => !n.read);

    return (
        <div className="min-h-screen bg-black text-white pb-24 font-sans">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-[#121212]/95 backdrop-blur-xl border-b border-[#2C2C2C] px-4 h-[60px] flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-[#1E1E1E] rounded-full transition-colors">
                        <ArrowLeft size={24} className="text-gray-400" />
                    </button>
                    <span className="font-condensed font-black text-xl uppercase italic tracking-tighter">Notifications</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={markAllRead} className="p-2 text-gray-400 hover:text-white" title="Mark all read">
                        <Check size={20} />
                    </button>
                    <button onClick={clearAll} className="p-2 text-gray-400 hover:text-red-500" title="Clear all">
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="p-4 flex gap-2">
                <button 
                    onClick={() => setFilter('ALL')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase transition-colors ${filter === 'ALL' ? 'bg-white text-black' : 'bg-[#1E1E1E] text-gray-500'}`}
                >
                    All
                </button>
                <button 
                    onClick={() => setFilter('UNREAD')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase transition-colors ${filter === 'UNREAD' ? 'bg-white text-black' : 'bg-[#1E1E1E] text-gray-500'}`}
                >
                    Unread
                </button>
            </div>

            {/* List */}
            <div className="px-4 space-y-2">
                {filteredNotifications.length > 0 ? filteredNotifications.map(notification => (
                    <div 
                        key={notification.id} 
                        className={`
                            relative flex items-start gap-4 p-4 rounded-xl border transition-all
                            ${notification.read ? 'bg-[#121212] border-[#2C2C2C] opacity-80' : 'bg-[#1E1E1E] border-indigo-500/30'}
                        `}
                    >
                        {!notification.read && (
                            <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-indigo-500"></div>
                        )}
                        
                        <div className="w-10 h-10 rounded-full bg-[#0A0A0A] border border-[#333] flex items-center justify-center shrink-0">
                            {getIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <h4 className={`text-sm font-bold mb-0.5 ${notification.read ? 'text-gray-400' : 'text-white'}`}>
                                {notification.title}
                            </h4>
                            <p className="text-xs text-gray-500 leading-relaxed mb-2">
                                {notification.message}
                            </p>
                            <span className="text-[10px] font-bold text-gray-600 uppercase">
                                {notification.time}
                            </span>
                        </div>

                        <button 
                            onClick={() => deleteNotification(notification.id)}
                            className="self-center p-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                )) : (
                    <div className="py-20 text-center text-gray-500">
                        <Bell size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="uppercase font-bold">No notifications found</p>
                    </div>
                )}
            </div>
        </div>
    );
};
