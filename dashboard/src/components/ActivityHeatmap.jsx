import './ActivityHeatmap.css'

export default function ActivityHeatmap() {
  // Generate data for the entire year
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  const days = ['MON', 'WED', 'FRI']

  // Mock data - random activity levels
  const generateActivityData = () => {
    const data = {}
    for (let month = 0; month < 12; month++) {
      data[month] = {}
      for (let week = 0; week < 4; week++) {
        const key = `${month}-${week}`
        const rand = Math.random()
        if (rand < 0.3) {
          data[month][key] = 0 // empty
        } else if (rand < 0.5) {
          data[month][key] = 1 // green
        } else if (rand < 0.7) {
          data[month][key] = 2 // yellow
        } else {
          data[month][key] = 3 // red
        }
      }
    }
    return data
  }

  const activityData = generateActivityData()

  const getColor = (level) => {
    switch (level) {
      case 0:
        return 'empty'
      case 1:
        return 'green'
      case 2:
        return 'yellow'
      case 3:
        return 'red'
      default:
        return 'empty'
    }
  }

  return (
    <div className="activity-heatmap">
      <div className="heatmap-container">
        <div className="heatmap-header">
          <div className="corner-space"></div>
          {months.map(month => (
            <div key={month} className="month-label">
              {month}
            </div>
          ))}
        </div>

        <div className="heatmap-grid">
          <div className="day-labels">
            {days.map(day => (
              <div key={day} className="day-label">
                {day}
              </div>
            ))}
          </div>

          <div className="heatmap-rows">
            {days.map((day, dayIdx) => (
              <div key={day} className="heatmap-row">
                {months.map((month, monthIdx) => (
                  <div key={`${monthIdx}-${dayIdx}`} className="month-column">
                    {[0, 1, 2, 3].map(week => {
                      const level = activityData[monthIdx][`${monthIdx}-${week}`]
                      return (
                        <div
                          key={`${monthIdx}-${dayIdx}-${week}`}
                          className={`heatmap-cell ${getColor(level)}`}
                          title={`${month} Week ${week + 1}: ${['No activity', 'Good', 'Great', 'Excellent'][level]}`}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="heatmap-legend">
        <span>SCALE:</span>
        <div className="legend-cells">
          <div className="legend-cell empty"></div>
          <div className="legend-cell green"></div>
          <div className="legend-cell yellow"></div>
          <div className="legend-cell red"></div>
        </div>
      </div>
    </div>
  )
}
