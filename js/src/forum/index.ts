import {extend, override} from 'flarum/common/extend';
import app from 'flarum/forum/app';
import Switch from 'flarum/common/components/Switch';
import Model from 'flarum/common/Model';
import withAttr from 'flarum/common/utils/withAttr';
import FormattedMoney from './components/FormattedMoney';
import VoteModal from './components/VoteModal';

app.initializers.add('clarkwinkelmann-vote-with-money', () => {
    const {components} = flarum.extensions['fof-polls'] as any;

    // Capture vote intent and open special modal to confirm pledge amount
    override(components.DiscussionPoll.prototype, 'changeVote', function (original, option, evt: InputEvent) {
        if (!app.session.user || !this.poll.attribute('voteWithMoney')) {
            return original(option, evt);
        }

        app.modal.show(VoteModal, {
            poll: this.poll,
            option,
            onsubmit: () => {
                // Same logic as in DiscussionPoll.changeVote
                this.updateData();

                m.redraw();

                // Additional alert to improve UX
                app.alerts.show({type: 'success'}, app.translator.trans('clarkwinkelmann-vote-with-money.forum.vote.success'));
            },
        });
        (evt.target as HTMLInputElement).checked = false;
    });

    extend(components.CreatePollModal.prototype, 'oninit', function (items) {
        const {poll} = this.attrs;

        if (poll) {
            if (poll instanceof Model) {
                // In EditPollModel the poll will be a model
                this.voteWithMoney = poll.attribute('voteWithMoney');
                this.moneyVoteMin = poll.attribute('moneyVoteMin') + '';
                this.moneyVoteMax = poll.attribute('moneyVoteMax') + '';
            } else {
                // In CreatePollModal the poll will be the save data POJO
                this.voteWithMoney = poll.voteWithMoney;
                this.moneyVoteMin = poll.moneyVoteMin + '';
                this.moneyVoteMax = poll.moneyVoteMax + '';
            }
        }

        if (!this.moneyVoteMin && this.moneyVoteMin !== '0') {
            this.moneyVoteMin = '';
        }
        if (!this.moneyVoteMax && this.moneyVoteMax !== '0') {
            this.moneyVoteMax = '';
        }
    });

    extend(components.CreatePollModal.prototype, 'fields', function (items) {
        items.add('vote-with-money', m('.Form-group', Switch.component({
            state: !!this.voteWithMoney,
            onchange: (state: boolean) => {
                this.voteWithMoney = state;
            },
        }, app.translator.trans('clarkwinkelmann-vote-with-money.forum.poll.voteWithMoney'))));

        if (this.voteWithMoney) {
            items.add('vote-with-money-min', m('.Form-group', [
                m('label.label', app.translator.trans('clarkwinkelmann-vote-with-money.forum.poll.min')),
                m('input.FormControl', {
                    type: 'number',
                    min: 0,
                    step: 1,
                    value: this.moneyVoteMin,
                    onchange: withAttr('value', (value: string) => {
                        this.moneyVoteMin = value;
                    }),
                }),
            ]));

            items.add('vote-with-money-max', m('.Form-group', [
                m('label.label', app.translator.trans('clarkwinkelmann-vote-with-money.forum.poll.max')),
                m('input.FormControl', {
                    type: 'number',
                    min: 0,
                    step: 1,
                    value: this.moneyVoteMax,
                    onchange: withAttr('value', (value: string) => {
                        this.moneyVoteMax = value;
                    }),
                }),
            ]));
        }
    });

    function pollModalData(this: any, data: any) {
        if (data === null) {
            return;
        }

        data.voteWithMoney = this.voteWithMoney;
        data.moneyVoteMin = this.moneyVoteMin === '' ? null : this.moneyVoteMin;
        data.moneyVoteMax = this.moneyVoteMax === '' ? null : this.moneyVoteMax;
    }

    // Add data to submit. We need to extend both modals separately because despite extending each other they don't call parent
    extend(components.CreatePollModal.prototype, 'data', pollModalData);
    extend(components.EditPollModal.prototype, 'data', pollModalData);

    // Add className so our CSS can apply only to money poll voters
    override(components.ListVotersModal.prototype, 'className', function (override) {
        let className: string = override();

        if (this.attrs.poll.attribute('voteWithMoney')) {
            className += ' VotesModal--withMoneyPledges';
        }

        return className;
    });

    // Add pledge indicator next to voters
    extend(components.ListVotersModal.prototype, 'voteContent', function (vdom, vote: any) {
        if (!this.attrs.poll.attribute('voteWithMoney')) {
            return;
        }

        vdom.children.push(m('span.moneyPledged', FormattedMoney.component({
            money: vote.attribute('moneyPledged') || 0,
        })));
    });

});
