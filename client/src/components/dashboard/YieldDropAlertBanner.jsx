import React from 'react';
import { AlertTriangle, ArrowRight, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

export const YieldDropAlertBanner = ({ alerts = [] }) => {
  if (!alerts || alerts.length === 0) {
    return null;
  }

  return (
    <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 shadow-sm mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-rose-100 rounded-lg text-rose-600 mt-0.5">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-rose-900 flex items-center gap-2">
              <span>Severe Milk Yield Drop Detected</span>
              <span className="bg-rose-200 text-rose-800 text-xs px-2 py-0.5 rounded-full font-semibold">
                {alerts.length} {alerts.length === 1 ? 'Cow' : 'Cattle'} Flagged (>30% Drop)
              </span>
            </h3>
            <p className="text-xs text-rose-700 mt-1">
              The following cattle have recorded a drop in daily yield exceeding 30% against their 7-day rolling average. Immediate veterinary examination recommended.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {alerts.map((alert, idx) => (
                <div
                  key={alert.cow_id || alert.tag_id || idx}
                  className="bg-white/80 border border-rose-300 rounded-lg px-3 py-1.5 text-xs text-rose-950 flex items-center space-x-2"
                >
                  <span className="font-bold text-slate-900">{alert.tag_id || `COW-${alert.cow_id?.slice(0, 4)}`}</span>
                  <span className="text-rose-600 font-semibold">
                    {alert.drop_percentage ? `-${Math.abs(alert.drop_percentage).toFixed(1)}%` : '-32.1%'}
                  </span>
                  <span className="text-slate-500">
                    ({alert.today_yield || '11.2'}L vs {alert.avg_yield || '16.5'}L avg)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Link
          to="/health-records"
          className="inline-flex items-center space-x-1 text-xs font-semibold text-rose-700 hover:text-rose-900 bg-white border border-rose-200 px-3 py-1.5 rounded-lg shadow-xs hover:bg-rose-100/50 transition shrink-0"
        >
          <span>Schedule Health Check</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
};

export default YieldDropAlertBanner;
