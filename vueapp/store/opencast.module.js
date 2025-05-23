import ApiService from "@/common/api.service";
import axios from "@/common/axios.service";

const state = {
    series: [],
    servers: [],
    currentUser: {},
    currentUserSeries: '',
    currentView: 'videos',
    cid: null,
    site: null,
    axios_running: false,
    userCourses: [],
    userList: [],
    isLTIAuthenticated: {},
    currentLTIUser: {},
    opencastOffline: false
}

const getters = {
    series(state) {
        return state.series
    },
    servers(state) {
        return state.servers
    },
    currentUser(state) {
        return state.currentUser
    },
    currentUserSeries(state) {
        return state.currentUserSeries
    },
    currentView(state) {
        return state.currentView
    },
    cid(state) {
        return state.cid;
    },
    site(state) {
        return state.site;
    },
    axios_running(state) {
        return state.axios_running;
    },
    userCourses(state) {
        return state.userCourses;
    },
    userList(state) {
        return state.userList;
    },
    isLTIAuthenticated(state) {
        return state.isLTIAuthenticated;
    },
    currentLTIUser(state) {
        return state.currentLTIUser;
    },
    opencastOffline(state) {
        return state.opencastOffline;
    }
}


const actions = {
    updateCid({commit}, cid) {
        commit('setCid', cid);
    },

    updateSite({commit}, site) {
        commit('setSite', site);
    },

    updatePage({commit}, page) {
        commit('setPage', page);
    },

    async loadSeries({commit }, id) {
        return ApiService.get('opencast/allseries/' + id)
            .then(({ data }) => {
                commit('setSeries', data.series);
            });
    },

    async loadServers({ commit }) {
        return ApiService.get('opencast/servers')
            .then(({ data }) => {
                commit('setServers', data.servers);
            });
    },

    async loadCurrentUser({ commit }) {
        return ApiService.get('user')
            .then(({ data }) => {
                commit('setCurrentUser', data.data);
            });
    },

    async loadCurrentUserSeries({ commit }) {
        return ApiService.get('user/series')
            .then(({ data }) => {
                commit('setCurrentUserSeries', data.series_id);
                return data.series_id;
            });
    },

    async loadUserList({ commit }, search_term) {
        return ApiService.get('user/search/' + encodeURIComponent(search_term))
            .then(({ data }) => {
                commit('setUserList', data.users);
            });
    },

    axiosStart({ commit }) {
        commit('setAxiosRunning', true);
    },

    axiosStop({ commit }) {
        commit('setAxiosRunning', false);
    },

    async loadUserCourses({ commit, dispatch}) {
        return ApiService.get('courses')
            .then(({ data }) => {
                commit('setUserCourses', data);
            });
    },

    updateView({ commit, dispatch }, view) {
        commit('setView', view);
        commit('clearPaging');
    },

    async authenticateLti({ dispatch }) {
        // by reloading the simple config, LtiAuth.vue reloads the iframe for lti authentication
        return dispatch('simpleConfigListRead');
    },

    setUpload({ commit }, data) {
        return ApiService.put('courses/' + data.cid + '/upload/' + data.upload);
    },

    async checkLTIAuthentication({ commit, state, dispatch }, server)
    {
        let succeeded = false;

        try {
            const response = await axios({
                method: 'GET',
                url: server.name + "/lti/info.json",
                crossDomain: true,
                withCredentials: true,
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
                }
            });

            if (response.status === 200) {
                // Get LTI user info
                await dispatch('loadLTIUser', server);

                if (state.currentLTIUser[server.id]) {
                    // LTI session and LTI user are loaded successfully
                    commit('setLTIStatus', {
                        server: server.id,
                        authenticated: true
                    });

                    succeeded = true;
                }
            }
        } catch (error) {
            succeeded = false;
        }

        if (!succeeded) {
            // Clear lti status and user
            commit('setCurrentLTIUser', {
                server: server.id,
                user: null
            });
            commit('setLTIStatus', {
                server: server.id,
                authenticated: false
            });
        }
    },

    async loadLTIUser({ commit }, server) {
        try {
            const response = await axios({
                method: 'GET',
                url: server.name + "/info/me.json",
                crossDomain: true,
                withCredentials: true,
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
                }
            });

            if (response.status === 200) {
                commit('setCurrentLTIUser', {
                    server: server.id,
                    user: response.data
                });
            } else {
                commit('setCurrentLTIUser', {
                    server: server.id,
                    user: null
                });
            }
        } catch (error) {
            commit('setCurrentLTIUser', {
                server: server.id,
                user: null
            });
        }
    },

    setCourseEpisodesVisibility({ context }, data) {
        return ApiService.put('courses/' + data.cid + '/episodes_visibility', {visibility_option: data.visibility_option})
    },
}

const mutations = {
    setCid(state, cid) {
        state.cid = cid;
    },

    setSite(state, site) {
        state.site = site;
    },

    setView(state, view) {
        state.currentView = view;
    },

    setSeries(state, data) {
        state.series = data;
    },

    setServers(state, data) {
        state.servers = data;
    },

    setCurrentUser(state, data) {
        state.currentUser = data;
    },

    setCurrentUserSeries(state, data) {
        state.currentUserSeries = data;
    },

    setAxiosRunning(state, running) {
        state.axios_running = running;
    },

    setUserCourses(state, data) {
        state.userCourses = data;
    },

    setUserList(state, data) {
        state.userList = data;
    },

    setLTIStatus(state, params) {
        state.isLTIAuthenticated[params.server] = params.authenticated;
    },

    setCurrentLTIUser(state, params) {
        state.currentLTIUser[params.server] = params.user;
    },

    setOpencastOffline(state, data) {
        state.opencastOffline = data;
    }
}


export default {
    state,
    getters,
    mutations,
    actions
}
