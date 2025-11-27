import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';

export default function DataExport() {
  const { user } = useAuth();
  const [exportFormat, setExportFormat] = useState('json');
  const [dateRange, setDateRange] = useState('all');
  const [includeTypes, setIncludeTypes] = useState({
    cycles: true,
    symptoms: true,
    moods: true,
    bbt: true,
    notes: true
  });
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!user) return;

    setIsExporting(true);

    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real app, this would:
      // 1. Fetch user data from Firestore
      // 2. Format according to selected format
      // 3. Generate download file
      
      const mockData = {
        user: {
          name: user.name,
          exportDate: new Date().toISOString()
        },
        cycles: [
          {
            startDate: '2024-01-01',
            endDate: '2024-01-28',
            cycleLength: 28,
            periodLength: 5
          }
        ],
        dailyLogs: [
          {
            date: '2024-01-15',
            symptoms: ['cramps', 'headache'],
            mood: 'normal',
            notes: 'Sample log entry'
          }
        ]
      };

      const dataStr = exportFormat === 'json' 
        ? JSON.stringify(mockData, null, 2)
        : convertToCSV(mockData);
      
      const dataBlob = new Blob([dataStr], { 
        type: exportFormat === 'json' ? 'application/json' : 'text/csv' 
      });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cycletracker-export-${new Date().toISOString().split('T')[0]}.${exportFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const convertToCSV = (data) => {
    // Simple CSV conversion for demo
    let csv = 'Date,Type,Details\n';
    data.dailyLogs.forEach(log => {
      csv += `${log.date},symptoms,"${log.symptoms.join(', ')}"\n`;
      csv += `${log.date},mood,${log.mood}\n`;
      if (log.notes) {
        csv += `${log.date},notes,"${log.notes}"\n`;
      }
    });
    return csv;
  };

  const handleSelectAll = (selected) => {
    setIncludeTypes({
      cycles: selected,
      symptoms: selected,
      moods: selected,
      bbt: selected,
      notes: selected
    });
  };

  return (
    <div className="data-export-page">
      <div className="export-header">
        <h1>Data Export</h1>
        <p>Download your cycle tracking data for personal records or to share with healthcare providers</p>
      </div>

      <div className="export-content">
        {/* Export Format */}
        <div className="settings-section">
          <h2>Export Format</h2>
          
          <div className="format-options">
            <label className="radio-label">
              <input
                type="radio"
                name="format"
                value="json"
                checked={exportFormat === 'json'}
                onChange={(e) => setExportFormat(e.target.value)}
              />
              <span className="radio-checkmark"></span>
              JSON Format
              <small>Best for data analysis and importing to other apps</small>
            </label>
            
            <label className="radio-label">
              <input
                type="radio"
                name="format"
                value="csv"
                checked={exportFormat === 'csv'}
                onChange={(e) => setExportFormat(e.target.value)}
              />
              <span className="radio-checkmark"></span>
              CSV Format
              <small>Best for spreadsheets and basic analysis</small>
            </label>
          </div>
        </div>

        {/* Date Range */}
        <div className="settings-section">
          <h2>Date Range</h2>
          
          <div className="date-options">
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
              className="date-select"
            >
              <option value="all">All Time</option>
              <option value="last-30">Last 30 Days</option>
              <option value="last-90">Last 90 Days</option>
              <option value="last-year">Last Year</option>
              <option value="custom">Custom Range</option>
            </select>
            
            {dateRange === 'custom' && (
              <div className="custom-range">
                <input type="date" placeholder="Start date" />
                <span>to</span>
                <input type="date" placeholder="End date" />
              </div>
            )}
          </div>
        </div>

        {/* Data Types */}
        <div className="settings-section">
          <h2>Data Types to Include</h2>
          
          <div className="data-type-options">
            <div className="select-all">
              <button 
                onClick={() => handleSelectAll(true)}
                className="select-btn"
              >
                Select All
              </button>
              <button 
                onClick={() => handleSelectAll(false)}
                className="select-btn"
              >
                Deselect All
              </button>
            </div>
            
            {Object.entries(includeTypes).map(([type, included]) => (
              <label key={type} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={included}
                  onChange={(e) => setIncludeTypes(prev => ({
                    ...prev,
                    [type]: e.target.checked
                  }))}
                />
                <span className="checkmark"></span>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </label>
            ))}
          </div>
        </div>

        {/* Export Preview */}
        <div className="settings-section">
          <h2>Export Preview</h2>
          
          <div className="export-preview">
            <div className="preview-stats">
              <div className="preview-stat">
                <span className="stat-label">Estimated Records:</span>
                <span className="stat-value">~150 entries</span>
              </div>
              <div className="preview-stat">
                <span className="stat-label">File Size:</span>
                <span className="stat-value">~50 KB</span>
              </div>
              <div className="preview-stat">
                <span className="stat-label">Format:</span>
                <span className="stat-value">{exportFormat.toUpperCase()}</span>
              </div>
            </div>
            
            <div className="preview-note">
              <p>
                <strong>Note:</strong> Your exported data will include all selected information 
                but will not include any personally identifiable information unless you have 
                entered it in notes or custom fields.
              </p>
            </div>
          </div>
        </div>

        {/* Export Actions */}
        <div className="settings-section">
          <div className="export-actions">
            <button 
              onClick={handleExport}
              disabled={isExporting}
              className="export-btn"
            >
              {isExporting ? 'Preparing Download...' : '📥 Download Export'}
            </button>
            
            <button className="share-btn">
              🔗 Share with Healthcare Provider
            </button>
          </div>
        </div>

        {/* Data Usage Tips */}
        <div className="settings-section">
          <h2>Using Your Exported Data</h2>
          
          <div className="usage-tips">
            <div className="tip-card">
              <h4>📊 Personal Analysis</h4>
              <p>Import into spreadsheet software to create custom charts and analyze patterns</p>
            </div>
            
            <div className="tip-card">
              <h4>🏥 Healthcare Visits</h4>
              <p>Share with your doctor to provide comprehensive cycle history</p>
            </div>
            
            <div className="tip-card">
              <h4>🔍 Research</h4>
              <p>Use for personal research projects or academic studies</p>
            </div>
            
            <div className="tip-card">
              <h4>💾 Backup</h4>
              <p>Keep as a personal backup of your health data</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}