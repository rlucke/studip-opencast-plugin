<template>
    <div>
        <StudipDialog
            :title="$gettext('Video freigeben') + ' - ' + event.title"
            :closeText="$gettext('Schließen')"
            :closeClass="'cancel'"
            height="600"
            width="600"
            @close="$emit('done', 'refresh')"
        >
            <template v-slot:dialogContent>
                <template v-if="!isShareable">
                    <messageBox :type="'error'">
                        {{ $gettext('Das Video kann nicht freigegeben werden, bitte versuchen Sie es später erneut!') }}
                    </messageBox>
                </template>
                <template v-else>
                    <form class="default" v-if="config.settings.OPENCAST_ALLOW_PERMISSION_ASSIGNMENT">
                        <fieldset>
                            <legend>
                                {{ $gettext('Rechte') }}
                            </legend>
                            <table class="default" v-if="videoShares.perms?.length > 0">
                                <thead>
                                    <tr>
                                        <th>
                                            {{ $gettext('Nutzer/in') }}
                                        </th>
                                        <th>
                                            {{ $gettext('Rechte') }}
                                        </th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(share, index) in videoShares.perms" v-bind:key="share.id">
                                        <td>
                                            {{ share.fullname }}
                                            <template v-if="share.user_id == currentUser.id">
                                                {{  $gettext('(sie selbst)') }}
                                            </template>
                                        </td>
                                        <td>
                                            {{ $filters.permname(share.perm, $gettext) }}
                                        </td>
                                        <td>
                                            <a v-if="share.user_id != currentUser.id"
                                               href="#" @click.prevent="removePerm(index)"
                                            >
                                                <studip-icon shape="trash" role="clickable" style="cursor: pointer"/>
                                            </a>
                                            <div v-else>
                                                <studip-icon shape="trash" role="inactive"/>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <ShareWithUsers
                                @add="addPerm"
                                :selectedUsers="shareUsers"
                            />
                        </fieldset>
                    </form>
                    <form class="default" v-if="config.settings.OPENCAST_ALLOW_SHARING || config.settings.OPENCAST_ALLOW_PUBLIC_SHARING">
                        <fieldset v-if="config.settings.OPENCAST_ALLOW_SHARING">
                            <legend>
                                {{ $gettext('Share Links') }}
                            </legend>

                            <table class="default" style="margin-bottom: 0;">
                                <colgroup>
                                    <col style="width: 90%">
                                    <col style="width: 10%">
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th>
                                            {{ $gettext('Link') }}
                                        </th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody v-if="videoShares.shares?.length > 0">
                                    <tr v-for="(slink, index) in videoShares.shares" :key="index">
                                        <td>
                                            <input type="text" readonly
                                                :data-id="slink?.id ?? 0"
                                                ref="shareLink"
                                                :value="slink?.link ?? $gettext('Noch nicht erstellt!')"
                                                style="width: 98%;"/>
                                        </td>
                                        <td>
                                            <template v-if="slink.is_new === true">
                                                <studip-icon shape="clipboard" role="inactive"
                                                    :title="$gettext('Share-Link noch nicht verfügbar')"/>
                                            </template>
                                            <template v-else>
                                                <studip-icon shape="clipboard" role="clickable"
                                                    @click="copyLinkShare(slink.id)"
                                                    :title="$gettext('Share-Link kopieren')"
                                                    style="cursor: pointer;"/>
                                            </template>
                                            <studip-icon shape="remove" role="clickable"
                                                @click="removeLinkShare(index)"
                                                :title="$gettext('Share-Link löschen')"
                                                style="cursor: pointer; margin-left: 5px;"/>
                                        </td>
                                    </tr>
                                </tbody>
                                <tbody v-else>
                                    <tr>
                                        <td colspan="2">
                                            {{ $gettext('Es existiert bisher kein Share-Link') }}
                                        </td>
                                    </tr>
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colspan="2">
                                            <StudipButton icon="add" @click.prevent="addLinkShare">
                                                {{ $gettext('Share-Link hinzufügen') }}
                                            </StudipButton>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </fieldset>

                        <fieldset v-if="config.settings.OPENCAST_ALLOW_PUBLIC_SHARING">
                            <legend>
                                {{ $gettext('Weltweiter Zugriff') }}
                            </legend>

                            {{ $gettext('Sie können das Video weltweit zugreifbar machen und dadurch z.B. '
                                + 'die Videodateien in externe Videoplayer integrieren. Bitte beachten Sie, '
                                + 'dass es mehrere Minuten dauern kann, bevor die Änderung abgeschlossen ist. '
                                + 'Währenddessen ist es nicht möglich, den Status erneut zu ändern!') }}
                            <br><br>
                            <template v-if="event.visibility == 'public'">
                                {{ $gettext('Das Video ist momentan weltweit zugreifbar.') }}
                                <br>
                                <a style="cursor: pointer" @click.stop="performAction('VideoDownload')">
                                    {{  $gettext('Links zu den Mediendateien anzeigen.') }}
                                    <studip-icon shape="link-intern" role="clickable" />
                                </a>
                                <br>
                                <a style="cursor: pointer" @click.stop="performAction('VideoEmbeddingCode')">
                                    {{  $gettext('Einbettungsoptionen anzeigen.') }}
                                    <studip-icon shape="link-intern" role="clickable" />
                                </a>
                                <br><br>

                                <StudipButton icon="trash"
                                    :disabled="processing"
                                    @click.prevent="setVisibility('internal')"
                                >
                                    {{ $gettext('Video nur berechtigten Personen zugreifbar machen') }}
                                </StudipButton>
                            </template>

                            <StudipButton icon="add"
                                @click.prevent="setVisibility('public')"
                                :disabled="processing"
                                v-else
                            >
                                {{ $gettext('Video weltweit zugreifbar machen') }}
                            </StudipButton>
                        </fieldset>
                    </form>
                </template>
                <MessageList :float="true" :dialog="true" />
            </template>
        </StudipDialog>
    </div>
</template>

<script>
import { mapGetters } from "vuex";
import StudipDialog from '@studip/StudipDialog'
import StudipIcon from '@studip/StudipIcon';
import StudipButton from "@studip/StudipButton";
import MessageList from "@/components/MessageList";
import MessageBox from "@/components/MessageBox.vue";

import ShareWithUsers from './VideoAccess/ShareWithUsers';

export default {
    name: 'VideoAccess',

    components: {
        StudipDialog, StudipIcon,
        ShareWithUsers, StudipButton,
        MessageList, MessageBox
    },

    props: ['event'],

    emits: ['done', 'cancel', 'doAction'],

    data() {
        return {
            shareUsers: [],
            processing: false,
            add_perm_error: {
                type: 'error',
                text: this.$gettext('Beim Hinzufügen der Freigabe ist ein Fehler aufgetreten.'),
                dialog: true
            },
            remove_perm_error: {
                type: 'error',
                text: this.$gettext('Beim Entfernen der Freigabe ist ein Fehler aufgetreten.'),
                dialog: true
            },
            add_link_error: {
                type: 'error',
                text: this.$gettext('Beim Hinzufügen des Links ist ein Fehler aufgetreten.'),
                dialog: true
            },
            remove_link_error: {
                type: 'error',
                text: this.$gettext('Beim Löschen des Links ist ein Fehler aufgetreten.'),
                dialog: true
            }
        }
    },

    computed: {
        ...mapGetters({
            'videoShares' : 'videoShares',
            'currentUser' : 'currentUser',
            'config'      : 'simple_config_list'
        }),

        isShareable() {
            if (!this.config.settings.OPENCAST_ALLOW_SHARING
                && !this.config.settings.OPENCAST_ALLOW_PUBLIC_SHARING
                && !this.config.settings.OPENCAST_ALLOW_PERMISSION_ASSIGNMENT
            ) {
                return false;
            }

            if (this.event?.state === 'running') {
                return false;
            }

            return this.event?.perm === 'owner' || this.event?.perm === 'write';
        }
    },

    methods: {
        addPerm(user)
        {
            this.shareUsers.push(user);

            this.$store.dispatch('updateVideoShares', {
                token: this.event.token,
                shares: this.videoShares
            })
            .catch(() => {
                // find the index of the user that was just added and remove it
                let index = this.shareUsers.findIndex(u => u.user_id == user.user_id);
                this.shareUsers.splice(index, 1);
                this.$store.dispatch('addMessage', add_perm_error);
            })
        },

        removePerm(index)
        {
            if (!confirm(this.$gettext('Sind Sie sicher, dass Sie diese Freigabe entfernen möchten?'))) {
                return;
            }

            let perm = this.videoShares.perms.splice(index, 1)[0];

            this.$store.dispatch('updateVideoShares', {
                token: this.event.token,
                shares: this.videoShares
            })
            .catch((er) => {
                this.videoShares.perms.splice(index, 0, perm);
                this.$store.dispatch('addMessage', remove_perm_error);
            })
        },

        addLinkShare()
        {
            let dummyLink = {
                is_new: true
            }
            this.videoShares.shares.push(dummyLink);

            this.$store.dispatch('updateVideoShares', {
                token: this.event.token,
                shares: this.videoShares
            }).then(({ data }) => {
                this.initVideoShares();
            }).catch((er) => {
                this.$store.dispatch('addMessage', add_link_error);
            });
        },

        removeLinkShare(index)
        {
            if (!confirm(this.$gettext('Sind Sie sicher, dass Sie diese Freigabe entfernen möchten?'))) {
                return;
            }

            let link = this.videoShares.shares.splice(index, 1)[0];

            this.$store.dispatch('updateVideoShares', {
                token: this.event.token,
                shares: this.videoShares
            }).then(({ data }) => {
                this.initVideoShares();
            }).catch((er) => {
                this.videoShares.shares.splice(index, 0, link);
                this.$store.dispatch('addMessage', remove_link_error);
            });
        },

        copyLinkShare(id) {
            let input = this.$refs.shareLink.find(elm => elm.dataset.id == id);
            if (input) {
                try {
                    input.select();
                    document.execCommand("copy");
                    document.getSelection().removeAllRanges();
                    this.$store.dispatch('addMessage', {
                        type: 'success',
                        text: this.$gettext('Der Link wurde in die Zwischenablage kopiert.'),
                        dialog: true
                    });
                } catch(e) {
                    console.error(e);
                    this.$store.dispatch('addMessage', {
                        type: 'error',
                        text: this.$gettext('Der Link konnte nicht kopiert werden.'),
                        dialog: true
                    });
                }
            }
        },

        initVideoShares() {
            this.$store.dispatch('loadVideoShares', this.event.token)
            .then(() => {
                this.shareUsers = this.videoShares.perms
            });
        },

        setVisibility(vis)
        {
            this.$store.dispatch('clearMessages', true);
            this.processing = true;

            let view = this;

            this.$store.dispatch('updateVideoVisibility', {
                'token': this.event.token,
                'visibility': vis
            }).then(({ data }) => {
                view.event.visibility = vis;
                view.$store.dispatch('addMessage', {
                    type: 'success',
                    text: data,
                    dialog: true
                });
            }).catch((err) => {
                view.$store.dispatch('addMessage', {
                    type: 'error',
                    text: err.response.data,
                    dialog: true
                });
            }).finally(() => {
                view.processing = false;
            });
        },

        performAction(action) {
            this.$emit('doAction', {event: JSON.parse(JSON.stringify(this.event)), actionComponent: action});
        },
    },

    mounted ()
    {
        this.$nextTick(() => {
            this.initVideoShares();
        });
    },
}
</script>
