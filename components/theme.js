import createTheme from 'react-storefront/theme/createTheme'
import { red } from '@material-ui/core/colors'

// Create a theme instance.
const theme = createTheme({
  palette: {
    primary: {
      main: '#556cd6',
      light: '#d6dcf9',
    },
    secondary: {
      main: '#19857b',
      light: '#dbfffc',
    },
    error: {
      main: red.A400,
    },
    background: {
      default: '#fff',
    },
  },
  overrides: {},
})

export default theme
