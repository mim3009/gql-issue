import {ApolloClient, InMemoryCache, HttpLink, ApolloLink, concat} from '@apollo/client'
import crossFetch from 'cross-fetch'
import {getAppOrigin} from 'pwa-kit-react-sdk/utils/url'
import {getConfig} from 'pwa-kit-runtime/utils/ssr-config'

class ContentfulAPI {
    /**
     * Represents ContentfulAPI
     * @constructor
     */
    constructor() {
        this.client = null
    }

    /**
     * Singleton method, retrieves Apollo client to make calls to Contentful GraphQL API endpoint
     * @returns {ApolloClient}
     */
    getClient() {
        if (!this.client) {
            const {
                app: {contentfulAPI: config}
            } = getConfig()
            const httpLink = new HttpLink({
                // eslint-disable-next-line max-len
                uri: `${getAppOrigin()}${config.proxyPath}/content/${
                    config.parameters.contentVersion
                }/spaces/${config.parameters.spaceId}/environments/${
                    config.parameters.environmentId
                }`,
                fetch: crossFetch
            })
            const authMiddleware = new ApolloLink((operation, forward) => {
                operation.setContext({
                    headers: {
                        authorization: `Bearer ${config.parameters.appCDAToken}`
                    }
                })

                return forward(operation)
            })

            this.client = new ApolloClient({
                cache: new InMemoryCache(),
                link: concat(authMiddleware, httpLink),
                ssrMode: typeof window === 'undefined'
            })
        }

        return this.client
    }

    /**
     * Makes GraphQL API call to Contentful
     * @param {Object} query - query
     * @param {Object} variables - variables
     * @returns {Object|null}
     */
    query(query, variables) {
        return this.getClient()
            .query({
                query,
                variables
            })
            .then(({data, errors}) => {
                if (!errors) {
                    try {
                        return JSON.parse(JSON.stringify(data))
                    } catch {
                        return null
                    }
                }

                return null
            })
            .catch(() => {
                return null
            })
    }
}

export default new ContentfulAPI()
