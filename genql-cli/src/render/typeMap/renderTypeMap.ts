import {
    GraphQLSchema,
    isEnumType,
    isInterfaceType,
    isObjectType,
    isScalarType,
    isUnionType,
    isInputObjectType,
} from 'graphql'
import { excludedTypes } from '../common/excludedTypes'
import { RenderContext } from '../common/RenderContext'
import { objectType } from './objectType'
import { scalarType } from './scalarType'
import { unionType } from './unionType'
import { TypeMap } from 'genql-runtime/dist/types'

export const renderTypeMap = (schema: GraphQLSchema, ctx: RenderContext) => {
    // remove fields key,
    // remove the Type.type and Type.args, replace with [type, args]
    // reverse args.{name}
    // Args type is deduced and added only when the concrete type is different from type name, remove the scalar field and replace with a top level scalars array field.
    const result: TypeMap = {
        scalars: [],
        types: {},
    }

    Object.keys(schema.getTypeMap())
        .filter((t) => !excludedTypes.includes(t))
        .map((t) => schema.getTypeMap()[t])
        .map((t) => {
            if (isObjectType(t) || isInterfaceType(t) || isInputObjectType(t))
                result.types[t.name] = objectType(t, ctx)
            else if (isUnionType(t)) result.types[t.name] = unionType(t, ctx)
            else if (isScalarType(t) || isEnumType(t)) {
                result.scalars.push(t.name)
                result.types[t.name] = scalarType(t, ctx)
            }
        })

    // change names of query, mutation on schemas that chose different names (hasura)
    const q = schema.getQueryType()
    if (q?.name && q?.name !== 'Query') {
        delete result.types[q.name]
        result.types.Query = objectType(q, ctx)
        // result.Query.name = 'Query'
    }

    const m = schema.getMutationType()
    if (m?.name && m.name !== 'Mutation') {
        delete result.types[m.name]
        result.types.Mutation = objectType(m, ctx)
        // result.Mutation.name = 'Mutation'
    }

    const s = schema.getSubscriptionType()
    if (s?.name && s.name !== 'Subscription') {
        delete result.types[s.name]
        result.types.Subscription = objectType(s, ctx)
        // result.Subscription.name = 'Subscription'
    }

    ctx.addCodeBlock(JSON.stringify(result))
}
