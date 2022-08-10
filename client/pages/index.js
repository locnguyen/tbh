import React from 'react'
import Head from 'next/head'
import {withUrqlClient} from 'next-urql'
import {useQuery} from "urql";

/**
 * Put everything in this god file because of time constraints
 *
 */

const viewer = `
  query {
    viewer {
      id
      email
      school {
        id
      }
      sessions {
        id
        survey {
          template {
            id
            questions {
              id
              prompt
              inputFieldConfig {
                type
                name
                options {
                  value
                }
              }
            }
          }
          answers {
            value
            question {
              prompt
            }
          }
        }
      }
    }
  }
`

// Should add prop validlation! And field level validation, e.g. required or not
const AnswerInputField = props => {
  switch (props.config.type) {
    case 'TEXTAREA':
      return <textarea/>
    case 'RADIO':
      return <>{props.config.options.map((o, idx) => <label>
        <input type="radio" value={o.value} key={o.idx} name={props.config.name}/>
          {o.value}</label>)}
        </>
    default:
      return null
  }

}

/**
 * Not implemented because of time but we need to call the submitSessionSurveyResponse mutation on button click
 */
const Survey = () => {
  const [{fetching, data, error}] = useQuery({
    query: viewer,
  })

  if (fetching) {
    return <div>Hold on, we're getting your survey!</div>
  }

  if (error) {
    return <div>Woah something bad happened!</div>
  }

  return <div className="survey">
    {data.viewer.sessions[0].survey.template.questions.map((q, idx) => <div key={q.id} className="question-container">
        <div className="question-prompt">
          {q.prompt}
        </div>
        <div className="question-answer">
          <AnswerInputField config={q.inputFieldConfig}/>
        </div>
      </div>
    )}
    <button className="submitBtn">Submit</button>
  </div>
}


const Home = () => {
  return (
    <div className="container">
      <Head>
        <title>tbh</title>
        <link rel="icon" href="/favicon.ico"/>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin/>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@500&display=swap" rel="stylesheet"/>
      </Head>

      <main>
        <h1 className="title">
          /tbh.
        </h1>

        <Survey/>
      </main>

      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          background-color: #F8F0E0;
          color: #1C216C;
          font-family: Poppins,serif;
          width: 100%;
        }

        .survey {
          display: flex;
          align-items: center;
          flex-direction: column;
          width: 50%;
        }

        .question-container {
          width: 100%;
          text-align: center;
          align-items: center;
        }

        .question-prompt {

        }

        .question-answer {

        }
        
        textarea {
          width: 100%;
          border: 0;
        }
        
        .submitBtn {
          background-color: #6AAC89;
          border: 0;
        }
      `}</style>
    </div>
  )
}

export default withUrqlClient(() => ({url: 'http://localhost:9000/graphql'}))(Home)