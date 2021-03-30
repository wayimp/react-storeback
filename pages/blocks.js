import React from 'react'
import { Container, Typography } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import LoadMask from 'react-storefront/LoadMask'
import Head from 'next/head'
import Button from '@material-ui/core/Button'
import { client } from '../utilities/client'
import Grid from '@material-ui/core/Grid'
import ImagesExample from '../components/SlateImages.tsx'
import RichTextExample from '../components/SlateRichText.tsx'

const useStyles = makeStyles(theme => ({
  main: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'flex-start',
    flexDirection: 'column',
    textAlign: 'center',
    margin: theme.spacing(10, 0, 0, 0),
    overflow: 'auto',
  },
}))

export default function Menus (props) {
  const classes = useStyles()

  return (
    <>
      <Head>
        <title>Editor</title>
      </Head>
      <Container maxWidth='lg'>
        <div className={classes.main}>
          <RichTextExample />
        </div>
      </Container>
    </>
  )
}
