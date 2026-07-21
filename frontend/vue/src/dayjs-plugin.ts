import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import customParseFormat from 'dayjs/plugin/customParseFormat'

// Extend Day.js with plugins
dayjs.extend(utc)
dayjs.extend(customParseFormat)

// Export Day.js for use in the application
export default dayjs
