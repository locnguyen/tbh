import http from 'http'
import express from 'express'
import {ApolloServer, gql} from 'apollo-server-express'
import {ApolloServerPluginDrainHttpServer} from 'apollo-server-core'
import {DocumentNode} from "graphql";


/**
 * We'll hardcode everything in this god file since it's for demo purposes only.
 *
 * Of course, this doesn't really work for more than one user (the person running the server)
 *
 */
const typeDefs = gql`
    type Query {
        viewer: User
        questions(input: QuestionSelectionInput!): [Question]!
    }
    
    type Mutation {
        submitSessionSurveyResponse(input: SubmitSessionSurveyInput!): Session!
    }
    
    input QuestionSelectionInput {
        schoolId: ID
    }

    enum InputFieldType {
        RADIO
        CHECKBOX
        TEXTAREA
        TEXT
    }
    
    type InputFieldOption {
        value: String
    }

    type InputFieldConfig {
        type: InputFieldType!
        name: String!
        required: Boolean!
        options: [InputFieldOption]!
    }
    
    type Session {
        id: ID!
        survey: Survey!
    }
    
    """
    This contains the user's answers to a survey's questions
    """
    type Survey {
        id: ID!
        template: SurveyTemplate!
        answers:  [Answer]!
    }
    
    type Answer {
        id: ID!
        question: Question!
        value: String!
    }
    
    input AnswerInput {
        questionId: ID!
        value: String!
    }
    
    """
    Saves the user's survey answers to our "database"
    """
    input SubmitSessionSurveyInput {
        sessionId: ID!
        email: String!
        answers: [AnswerInput]!
    }
    
    """
    This is like a blank survey with questions that can be "handed out"
    """
    type SurveyTemplate {
        id: ID!
        questions: [Question]!
    }

    """
    Reusable questions that can be used at any school if it is associated
    """
    type Question {
        id: ID!
        schools: [School]!
        prompt: String!
        inputFieldConfig: InputFieldConfig!
    }
    
    type User {
        id: ID!
        email: String!
        school: School!
        sessions: [Session]!
    }
    
    type School {
        id: ID!
    }
   
`
const questions = [
    {
        id: '23897',
        prompt: 'How are you feeling after the session today?',
        schoolIds: ['99'],
        inputFieldConfig: {
            type: 'TEXTAREA',
            name: 'afterSes',
            options: [],
        }
    }, {
        id: '49122',
        prompt: 'Are there any topics you would like covered next week?',
        schoolIds: ['99'],
        inputFieldConfig: {
            type: 'TEXTAREA',
            name: 'newTopic',
            options: [],
        }
    }, {
        id: '29925',
        prompt: 'Would you recommend this topic to someone else?',
        schoolIds: ['99'],
        inputFieldConfig: {
            type: 'RADIO',
            name: 'REC',
            options: [{
                value: 'Yes'
            }, {
                value: 'No'
            }, {
                value: 'Maybe'
            }]
        }
    }
]

const surveyTemplate = {
    id: '1092',
    questions,
}

const survey = {
    id: '1930',
    template: surveyTemplate,
    answers: [],
}

const session = {
    id: '9292',
    survey,
}

const user = {id: 1, email: 'someone@tbh.com', school: {id: 99}, sessions: [session]}

const resolvers = {
    Mutation: {
        submitSessionSurveyResponse: (parent: any, args: any, ctx: any, input: any, info: any) => {
            // Of course this is only going to work for one user (the one running this server)
            const {sessionId, answers} = args.input
            const ses = user.sessions.find(s => s.id === sessionId)
            if (ses) {
                // and yes, we will be overriding answers everytime the mutation is called
                ses.survey!.answers = answers.map((a: any) => ({
                    question: questions.find(q => q.id === a.questionId),
                    ...a,
                }))
            }
            return session
        },
    },
    Query: {
        viewer: () => user,
    }
}

const init = async (typeDefs: DocumentNode, resolvers: any) => {
    const app = express()
    const httpServer = http.createServer(app)
    const server = new ApolloServer({
        resolvers,
        typeDefs,
        plugins: [ApolloServerPluginDrainHttpServer({httpServer})]
    })

    await server.start()
    server.applyMiddleware({app})
    // Move hardcoded port number into envar in a .env file
    httpServer.listen({port: 9000}, () => console.log("Server started!"))
}

init(typeDefs, resolvers)