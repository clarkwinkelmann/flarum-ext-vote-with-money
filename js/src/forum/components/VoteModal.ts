import app from 'flarum/forum/app';
import Modal, {IInternalModalAttrs} from 'flarum/common/components/Modal';
import Button from 'flarum/common/components/Button';
import {ApiPayloadSingle} from 'flarum/common/Store';
import Model from 'flarum/common/Model';
import FormattedMoney from './FormattedMoney';

interface VoteModalAttrs extends IInternalModalAttrs {
    // We don't have type-hints available for Poll or PollOption
    poll: Model
    option: Model
    onsubmit: () => void
}

export default class VoteModal extends Modal<VoteModalAttrs> {
    preselectAmount: number = 0
    customAmount: boolean = false
    customAmountValue: string = ''

    oninit(vnode: any) {
        super.oninit(vnode);

        if ((app.forum.attribute<string[]>('moneyVotePreselection') || []).length === 0) {
            this.customAmount = true;
        }
    }

    className() {
        return 'MoneyPollVoteModal Modal--small';
    }

    title() {
        return app.translator.trans('clarkwinkelmann-vote-with-money.forum.vote.title');
    }

    content() {
        const preselection = app.forum.attribute<string[]>('moneyVotePreselection') || [];

        return m('.Modal-body', [
            m('.Form-group', [
                app.translator.trans('clarkwinkelmann-vote-with-money.forum.vote.target', {
                    answer: this.attrs.option.attribute('answer'),
                }),
            ]),
            preselection.length > 0 ? m('.Form-group', [
                preselection.map((amount, index) => {
                    return m('label', [
                        m('input', {
                            type: 'radio',
                            name: 'vote-with-money-preselection',
                            checked: this.preselectAmount === index && !this.customAmount,
                            onchange: () => {
                                this.preselectAmount = index;
                                this.customAmount = false;
                            },
                        }),
                        ' ',
                        FormattedMoney.component({
                            money: amount,
                        }),
                    ]);
                }),
                m('label', [
                    m('input', {
                        type: 'radio',
                        name: 'vote-with-money-preselection',
                        checked: this.customAmount,
                        onchange: () => {
                            this.customAmount = true;
                        },
                    }),
                    ' ',
                    app.translator.trans('clarkwinkelmann-vote-with-money.forum.vote.optionCustom'),
                ]),
            ]) : null,
            this.customAmount ? m('.Form-group', [
                m('label', app.translator.trans('clarkwinkelmann-vote-with-money.forum.vote.label.custom')),
                m('input.FormControl', {
                    type: 'number',
                    value: this.customAmountValue,
                    onchange: (event: InputEvent) => {
                        this.customAmountValue = (event.target as HTMLInputElement).value;
                    },
                    min: this.attrs.poll.attribute('moneyVoteMin'),
                    max: this.attrs.poll.attribute('moneyVoteMax') || undefined,
                    step: 1,
                }),
            ]) : '',
            m('.Form-group', [
                app.translator.trans('clarkwinkelmann-vote-with-money.forum.vote.balance', {
                    amount: FormattedMoney.component({
                        money: app.session.user!.attribute('money'),
                    }),
                }),
            ]),
            m('.Form-group', Button.component({
                type: 'submit',
                className: 'Button Button--primary',
                loading: this.loading,
            }, app.translator.trans('clarkwinkelmann-vote-with-money.forum.vote.submit'))),
        ]);
    }

    onsubmit(event: Event) {
        event.preventDefault();

        this.loading = true;

        // Same API call as in DiscussionPoll.changeVote
        app.request<ApiPayloadSingle>({
            method: 'PATCH',
            url: `${app.forum.attribute('apiUrl')}/fof/polls/${this.attrs.poll.id()}/vote`,
            errorHandler: this.onerror.bind(this),
            body: {
                data: {
                    optionId: this.attrs.option.id(),
                    amountPledged: this.customAmount ? this.customAmountValue : app.forum.attribute<string[]>('moneyVotePreselection')[this.preselectAmount],
                },
            },
        })
            .then(payload => {
                app.store.pushPayload(payload);

                this.hide();
                this.attrs.onsubmit();
            })
            .catch(() => {
                this.loading = false;
                m.redraw();
            });
    }
}
