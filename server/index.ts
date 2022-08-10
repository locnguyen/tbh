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

    enum QuestionType {
        RADIO
        CHECKBOX
        TEXT
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
    
    input SubmitSessionSurveyInput {
        sessionId: ID!
        answers: [AnswerInput]!
    }
    
    """
    This is like a blank survey with questions that can be "handed out"
    """
    type SurveyTemplate {
        id: ID!
        questions: [Question]!
    }

    type Question {
        id: ID!
        prompt: String!
        type: QuestionType!
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
        type: 'TEXT',
        schoolIds: ['99']
    }, {
        id: '49122',
        prompt: 'Are there any topics you would like covered next week?',
        type: 'TEXT',
        schoolIds: ['99']
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
    httpServer.listen({port: 9000}, () => console.log("Server started!"))
}

init(typeDefs, resolvers)