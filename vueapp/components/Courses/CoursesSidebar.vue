<template>
    <div class="sidebar-widget oc--course-sidebar-widget" id="sidebar-navigation">
        <div class="sidebar-widget-header">
            {{ $gettext('Navigation') }}
        </div>
        <div class="sidebar-widget-content">
            <ul class="widget-list widget-links sidebar-navigation">
                <li :class="{
                    active: currentView == 'videos'
                    }"
                    v-on:click="setView('videos')">
                    <router-link :to="{ name: 'course' }">
                        {{ $gettext('Videos') }}
                    </router-link>
                </li>
                <li :class="{
                    active: currentView == 'schedule'
                    }"
                    v-if="canSchedule"
                    v-on:click="setView('schedule')">
                    <router-link :to="{ name: 'schedule' }">
                        {{ $gettext('Aufzeichnungen planen') }}
                    </router-link>
                </li>
            </ul>
        </div>
    </div>

    <div class="sidebar-widget" v-if="currentView == 'videos'">
        <div class="sidebar-widget-header">
            {{ $gettext('Wiedergabelisten') }}
        </div>
        <div class="sidebar-widget-content">
            <ul class="widget-list widget-links oc--sidebar-links sidebar-navigation">
                <template v-if="hasDefaultPlaylist">
                    <li :class="{
                        active: playlist?.token == p.token
                        }"
                        v-for="p in playlists"
                        v-bind:key="p.token"
                        v-on:click="setPlaylist(p)">
                        <router-link :to="{ name: 'course' }">
                            <div class="oc--playlist-title-contanier">
                                <span class="oc--playlist-title">
                                    {{ p.title }}
                                </span>
                                <div v-if="p.is_default == true"
                                    class="tooltip oc--playlist-default-icon" :data-tooltip="$gettext('Standard-Kurswiedergabeliste')">
                                    <studip-icon shape="check-circle" :role="playlist?.token == p.token ? 'info_alt' : 'clickable'" :size="16"/>
                                </div>
                            </div>
                        </router-link>
                    </li>

                    <li v-if="canEdit" data-reject-toggle-sidebar="true">
                        <a href="#" @click.prevent="showCreatePlaylist">
                            <studip-icon style="margin-top: -2px;" shape="add" role="clickable"/>
                            {{ $gettext('Wiedergabeliste hinzufügen') }}
                        </a>
                    </li>
                </template>
                <template v-else>
                    <li v-if="canEdit">
                        <a href="#" @click.prevent="showCreatePlaylist">
                            <studip-icon style="margin-top: -2px;" shape="add" role="clickable"/>
                            {{ $gettext('Kurswiedergabeliste hinzufügen') }}
                        </a>
                    </li>
                </template>
            </ul>
        </div>
    </div>

    <template v-if="currentView == 'schedule'">
        <div v-if="semester_list.length" class="sidebar-widget " id="sidebar-actions">
            <div class="sidebar-widget-header">
                {{ $gettext('Semesterfilter') }}
            </div>
            <div class="sidebar-widget-content">
                <select class="sidebar-selectlist submit-upon-select" v-model="semesterFilter">
                    <option v-for="semester in semester_list"
                        :key="semester.id"
                        :value="semester.id"
                        :selected="semester.id == semester_filter"
                    >
                        {{ semester.name }}
                    </option>
                </select>
            </div>
        </div>
        <div class="sidebar-widget " id="sidebar-actions" v-if="canSchedule && (schedule_list.length || !schedule_loading)">
            <div class="sidebar-widget-header">
                {{ $gettext('Aktionen') }}
            </div>
            <div class="sidebar-widget-content">
                <div class="oc--sidebar-dropdown-wrapper">
                    <span class="oc--sidebar-dropdown-text">
                        {{ $gettext('Zielwiedergabeliste für Aufzeichnungen') }}
                    </span>
                    <select class="oc--sidebar-dropdown-select sidebar-selectlist submit-upon-select" v-model="schedulePlaylistToken" @change="updateScheduledRecordingsPlaylists('scheduled')">
                        <option v-for="p in playlists"
                            :key="p.token"
                            :value="p.token"
                            :selected="schedulePlaylistToken == p.token"
                        >
                            {{ p.title }}
                        </option>
                    </select>
                </div>
                <div class="oc--sidebar-dropdown-wrapper" v-if="this.livestream_available">
                    <span class="oc--sidebar-dropdown-text">
                        {{ $gettext('Zielwiedergabeliste für Livestreams') }}
                    </span>
                    <select class="oc--sidebar-dropdown-select sidebar-selectlist submit-upon-select" v-model="livestreamPlaylistToken" @change="updateScheduledRecordingsPlaylists('livestreams')">
                        <option v-for="p in playlists"
                            :key="p.token"
                            :value="p.token"
                            :selected="livestreamPlaylistToken == p.token"
                        >
                            {{ p.title }}
                        </option>
                    </select>
                </div>
            </div>
        </div>
    </template>
    <template v-else>
        <div class="sidebar-widget " id="sidebar-actions" v-if="(canEdit || canUpload) && hasDefaultPlaylist">
            <div class="sidebar-widget-header">
                {{ $gettext('Wiedergabeliste bearbeiten') }}
            </div>
            <div class="sidebar-widget-content">
                <ul class="widget-list oc--sidebar-links widget-links" @click.capture="toggleSidebarOnResponsive">
                    <template v-if="videoSortMode">
                        <li v-if="canEdit && videoSortMode">
                            <a href="#" @click.prevent="$emit('saveSortVideo')">
                                <studip-icon style="margin-left: -20px;" shape="accept" role="clickable"/>
                                {{ $gettext('Sortierung speichern') }}
                            </a>
                        </li>
                        <li v-if="canEdit && videoSortMode">
                            <a href="#" @click.prevent="$emit('cancelSortVideo')">
                                <studip-icon style="margin-left: -20px;" shape="decline" role="clickable"/>
                                {{ $gettext('Sortierung abbrechen') }}
                            </a>
                        </li>
                    </template>
                    <template v-else>
                        <li v-if="(canEdit || canUpload)"
                            :class="{
                                'oc--menuentry--disabled': opencastOffline
                            }"
                        >
                            <a href="#" @click.prevent="openPlaylistAddVideosDialog">
                                <studip-icon style="margin-left: -20px;" shape="add" role="clickable"/>
                                {{ $gettext('Videos hinzufügen') }}
                            </a>
                        </li>
                        <li v-if="canEdit && downloadSetting !== 'never'">
                            <a v-if="!downloadEnabled" href="#" @click.prevent="setDownload(true)">
                                <studip-icon style="margin-left: -20px;" shape="decline" role="clickable"/>
                                {{ $gettext('Mediendownloads erlauben') }}
                            </a>
                            <a v-else href="#" @click.prevent="setDownload(false)">
                                <studip-icon style="margin-left: -20px;" shape="accept" role="clickable"/>
                                {{ $gettext('Mediendownloads verbieten') }}
                            </a>
                        </li>
                        <li v-if="canEdit"
                            :class="{
                                'oc--menuentry--disabled': opencastOffline
                            }"
                        >
                            <a href="#" @click.prevent="!opencastOffline && $emit('sortVideo')">
                                <studip-icon style="margin-left: -20px;" shape="hamburger" role="clickable"/>
                                {{ $gettext('Videos sortieren') }}
                            </a>
                        </li>
                        <li v-if="canEdit">
                            <a href="#" @click.prevent="$emit('editPlaylist')">
                                <studip-icon style="margin-left: -20px;" shape="edit" role="clickable"/>
                                {{ $gettext('Metadaten bearbeiten') }}
                            </a>
                        </li>
                    </template>
                </ul>
            </div>
        </div>

        <div class="sidebar-widget " id="sidebar-actions"
            v-if="(canEdit || canUpload && canShowStudio) && hasDefaultPlaylist && !videoSortMode"
        >
            <div class="sidebar-widget-header">
                {{ $gettext('Veranstaltungsweite Aktionen') }}
            </div>
            <div class="sidebar-widget-content">
                <ul class="widget-list oc--sidebar-links widget-links" @click.capture="toggleSidebarOnResponsive">
                    <li v-if="!opencastOffline && canUpload && course_config?.series?.series_id && canShowStudio">
                        <a :href="recordingLink" target="_blank">
                            <studip-icon style="margin-left: -20px;" shape="video" role="clickable"/>
                            {{ $gettext('Video aufnehmen') }}
                        </a>
                    </li>
                    <li v-if="canEdit">
                        <a href="#" v-if="!uploadEnabled" @click.prevent="setUpload(1)">
                            <studip-icon style="margin-left: -20px;" shape="decline" role="clickable"/>
                            {{ $gettext('Studierendenupload erlauben') }}
                        </a>
                        <a v-else href="#" @click.prevent="setUpload(0)">
                            <studip-icon style="margin-left: -20px;" shape="accept" role="clickable"/>
                            {{ $gettext('Studierendenupload verbieten') }}
                        </a>
                    </li>
                    <li v-if="canEdit" data-reject-toggle-sidebar="true">
                        <a href="#" @click.prevent="$emit('changeDefaultPlaylist')">
                            <studip-icon style="margin-left: -20px;" shape="refresh" role="clickable"/>
                            {{ $gettext('Standard-Kurswiedergabeliste ändern') }}
                        </a>
                    </li>
                    <li v-if="canEdit">
                        <a href="#" @click.prevent="$emit('changeDefaultVisibility')">
                            <studip-icon style="margin-left: -20px;" :shape="changeDefaultVisibilityIcon" role="clickable"/>
                            {{ $gettext('Standardsichtbarkeit Videos') }}
                        </a>
                    </li>
                </ul>
            </div>
        </div>

    </template>
</template>

<script>
import { useRoute } from 'vue-router';
import { mapGetters } from "vuex";

import StudipIcon from '@studip/StudipIcon.vue';
import PlaylistAddCard from '@/components/Playlists/PlaylistAddCard.vue';
import PlaylistsLinkCard from '@/components/Playlists/PlaylistsLinkCard.vue';

export default {
    name: 'episodes-action-widget',
    components: {
        StudipIcon,
        PlaylistAddCard,
        PlaylistsLinkCard,
    },

    emits: [
        'uploadVideo',
        'recordVideo',
        'editPlaylist',
        'sortVideo',
        'saveSortVideo',
        'cancelSortVideo',
        'changeDefaultPlaylist',
        'changeDefaultVisibility'
    ],

    data() {
        return {
            showAddDialog: false,
            semesterFilter: null,
            schedulePlaylistToken: null,
            livestreamPlaylistToken: null,
            targetPlaylistToken: null,
            routeObj: null,
        }
    },

    computed: {
        ...mapGetters(["playlists", "currentView", 'opencastOffline',
            "cid", "semester_list", "semester_filter", 'currentUser',
            'simple_config_list', 'course_config', 'playlist',
            'defaultPlaylist', 'videoSortMode', 'downloadSetting',
            'schedule_playlist', 'livestream_playlist', 'livestream_available',
            'schedule_list', 'schedule_loading'
        ]),

        fragment() {
            return this.$route.name;
        },

        canSchedule() {
            try {
                return this.cid !== undefined && // Make sure this is happening in a course!
                    this.currentUser.can_edit && // Make sure the user has sufficient "global" rights.
                    this.simple_config_list['settings']['OPENCAST_ALLOW_SCHEDULER'] && // Make sure it is configured!
                    this.course_config.scheduling_allowed; // Make sure the user is allowed to schedule recordings in the course!
            } catch (error) {
                return false;
            }
        },

        canShowStudio() {
            try {
                return this.cid !== undefined &&
                    this.currentUser.can_edit &&
                        this.simple_config_list['settings']['OPENCAST_ALLOW_STUDIO'] &&
                        this.hasDefaultPlaylist;
            } catch (error) {
                return false;
            }
        },

        recordingLink() {
            if (!this.simple_config_list.settings || !this.course_config || !this.canShowStudio) {
                return;
            }

            let config_id = this.simple_config_list.settings['OPENCAST_DEFAULT_SERVER'];
            let server    = this.simple_config_list.server[config_id];

            // use the first avai
            return window.STUDIP.URLHelper.getURL(
                server.studio, {
                    'upload.seriesId'  : this.course_config['series']['series_id'],
                    'upload.acl'       : true,
                    'upload.workflowId': this.getWorkflow(config_id),
                    'return.target'    : window.STUDIP.URLHelper.getURL('plugins.php/opencastv3/course?cid=' + this.cid),
                    'return.label'     : 'Stud.IP'
                }
            );
        },

        canEdit() {
            if (!this.course_config) {
                return false;
            }

            return this.course_config.edit_allowed;
        },

        canUpload() {
            if (!this.course_config) {
                return false;
            }

            return this.course_config.upload_allowed;
        },

        uploadEnabled() {
            if (!this.course_config) {
                return false;
            }

            return this.course_config.upload_enabled == 1;
        },

        downloadEnabled() {
            if (this.playlist) {
                if (this.playlist['allow_download'] === null) {
                    return this.downloadSetting === 'allow';
                }
                else {
                    return this.playlist['allow_download'];
                }
            }
            return false;
        },

        hasDefaultPlaylist() {
            return this.course_config?.has_default_playlist;
        },

        changeDefaultVisibilityIcon() {
            let course_hide_episodes = false;
            if (this.course_config.hasOwnProperty('course_hide_episodes')) {
                course_hide_episodes = this.course_config.course_hide_episodes;
            } else if (this.simple_config_list?.settings && this.simple_config_list.settings.hasOwnProperty('OPENCAST_HIDE_EPISODES')) {
                course_hide_episodes = this.simple_config_list.settings.OPENCAST_HIDE_EPISODES;
            }
            return course_hide_episodes ? 'visibility-invisible' : 'visibility-visible';
        }
    },

    methods: {
        setPlaylist(playlist) {
            this.$store.dispatch('setPlaylist', playlist);
            this.toggleSidebarOnResponsive();
        },

        async setView(page) {
            this.$store.dispatch('updateView', page);
            if (page == 'schedule') {
                this.$store.dispatch('clearMessages');
                this.$store.dispatch('getScheduleList');
                // Make sure playlists are loaded.
                await this.$store.dispatch('loadScheduledRecordingPlaylists');
                this.schedulePlaylistToken = this.schedule_playlist?.token;
                this.livestreamPlaylistToken = this.livestream_playlist?.token;
            }
        },

        setDownload(download) {
            this.$store.dispatch('setAllowDownloadForPlaylist', download)
        },

        setUpload(upload) {
            this.$store.dispatch('setUpload', {'cid': this.cid, 'upload': upload})
            .then(() => {
                this.$store.dispatch('loadCourseConfig', this.cid);
            });

        },

        showCreatePlaylist() {
            this.$store.dispatch('addPlaylistUI', true);
        },

        openPlaylistAddVideosDialog() {
            if (this.opencastOffline) {
                return;
            }

            this.$store.dispatch('togglePlaylistAddVideosDialog', true);
        },

        getWorkflow(config_id) {
            let wf_id = this.simple_config_list?.workflow_configs.find(wf_config => wf_config['config_id'] == config_id && wf_config['used_for'] === 'studio')['workflow_id'];
            return this.simple_config_list?.workflows.find(wf => wf['id'] == wf_id)['name'];
        },

        updateScheduledRecordingsPlaylists(type) {
            if (!this.canSchedule) {
                return;
            }
            this.$store.dispatch('clearMessages');
            if (type == 'scheduled') {
                this.$store.dispatch('setSchedulePlaylist', this.schedulePlaylistToken)
                .then(({data}) => {
                    this.$store.dispatch('addMessage', data.message);
                }).finally(async () => {
                    await this.$store.dispatch('loadPlaylists');
                    this.schedulePlaylistToken = this.schedule_playlist?.token;
                });
            } else if (type == 'livestreams') {
                this.$store.dispatch('setLivestreamPlaylist', this.livestreamPlaylistToken)
                .then(({data}) => {
                    this.$store.dispatch('addMessage', data.message);
                }).finally(async () => {
                    await this.$store.dispatch('loadPlaylists');
                    this.livestreamPlaylistToken = this.livestream_playlist?.token;
                });
            }
            this.toggleSidebarOnResponsive();
        },

        async setTargetPlaylist() {
            if (this.targetPlaylistToken) {
                if (this.playlist?.token == this.targetPlaylistToken) {
                    this.targetPlaylistToken = null;
                    return;
                }
                let playlist_filtered = this.playlists.filter(playlist => playlist.token == this.targetPlaylistToken)
                if (playlist_filtered?.length) {
                    await this.$nextTick();
                    this.setPlaylist(playlist_filtered[0]);
                    await this.$store.dispatch('loadPlaylists');
                    this.targetPlaylistToken = null;
                }
            }
        },

        ensureRenderedSidebarIsRemoved() {
            const sidebars = document.querySelectorAll('.sidebar-widget');
            for (let sidebar of sidebars) {
                if (sidebar.classList.contains('oc--course-sidebar-widget') === false) {
                    sidebar.remove();
                }
            }
        },

        /**
         * This method is used to toggle sidebar in responsive view.
         * This gets called on the outermost element of the action and playlist actions on ul elements.
         * To prevent an element from toggling the sidebar:
         *      i.e. when the dialog is opened in this component like AddPlaylis
         *  data-reject-toggle-sidebar attribute on the element must be set to true.
         *
         * @param {object} [event=null]
         *
         */
        toggleSidebarOnResponsive(event = null) {
            if (event && event.target.dataset?.rejectToggleSidebar && event.target.dataset.rejectToggleSidebar != 'false') {
                return;
            }
            let toggle_btn = document.getElementById('toggle-sidebar');
            let sidebar = document.getElementById('sidebar');
            if (sidebar && sidebar.classList.contains('responsive-show') && toggle_btn) {
                toggle_btn.click();
            }
        },

        async handleView() {
            if (this.routeObj?.path.includes('/schedule') && this.currentView != 'schedule' && this.canSchedule) {
                await this.$store.dispatch('loadPlaylists');
                await this.setView('schedule');
            } else if (this.routeObj?.path.includes('/videos') && this.currentView != 'videos') {
                await this.setView('videos');
            }
        }
    },

    async mounted() {
        this.$store.dispatch('simpleConfigListRead');
        this.semesterFilter = this.semester_filter;

        const route = useRoute();
        this.routeObj = route;
        if (this.routeObj?.query?.taget_pl_token) {
            this.targetPlaylistToken = route.query.taget_pl_token
        }

        await this.handleView();
    },

    beforeMount () {
        // Here we remove the rendered sidebar from the DOM before mount, to avoid any conflicts.
        this.ensureRenderedSidebarIsRemoved();
    },

    watch: {
        semesterFilter(newValue, oldValue) {
            if (newValue && oldValue && newValue != oldValue) {
                this.$store.dispatch('setSemesterFilter', newValue);
                this.$store.dispatch('clearMessages');
                this.$store.dispatch('getScheduleList');
            }
            this.toggleSidebarOnResponsive();
        },

        playlists(newValue) {
            if (newValue?.length && this.targetPlaylistToken) {
                this.setTargetPlaylist();
            }
        },

        canSchedule(newValue) {
            if (newValue === true) {
                this.handleView();
            }
        }
    }
}
</script>
