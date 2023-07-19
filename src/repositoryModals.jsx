/*
 * This file is part of Cockpit.
 *
 * Copyright (C) 2023 Red Hat, Inc.
 *
 * Cockpit is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation; either version 2.1 of the License, or
 * (at your option) any later version.
 *
 * Cockpit is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Cockpit; If not, see <http://www.gnu.org/licenses/>.
 */

import React, { useEffect, useState } from 'react';
import PropTypes from "prop-types";

import cockpit from 'cockpit';

import { Alert } from "@patternfly/react-core/dist/esm/components/Alert";
import { Button } from "@patternfly/react-core/dist/esm/components/Button";
import { Checkbox } from '@patternfly/react-core/dist/esm/components/Checkbox';
import { Flex, FlexItem } from "@patternfly/react-core/dist/esm/layouts/Flex/index.js";
import { Form, FormGroup } from "@patternfly/react-core/dist/esm/components/Form";
import { Modal } from "@patternfly/react-core/dist/esm/components/Modal";
import { Text } from "@patternfly/react-core/dist/esm/components/Text";
import { TextInput } from "@patternfly/react-core/dist/esm/components/TextInput";
import { TextArea } from "@patternfly/react-core/dist/esm/components/TextArea";
import { Select, SelectOption } from "@patternfly/react-core/dist/esm/deprecated/components/Select";
import { Spinner } from "@patternfly/react-core/dist/esm/components/Spinner/index.js";
import { ExclamationCircleIcon } from '@patternfly/react-icons';

import { FormHelper } from 'cockpit-components-form-helper.jsx';
import { useDialogs } from "dialogs.jsx";

import * as remotes from './remotes';

const _ = cockpit.gettext;

export const RemoveRepositoryModal = ({ origin, availableRemotes, refreshRemotes }) => {
    const Dialogs = useDialogs();
    const [error, setError] = useState('');
    const [selectedRemotes, setSelectedRemotes] = useState([]);

    const onDelete = () => {
        Promise.all(selectedRemotes.map(remote => remotes.deleteRemote(remote)))
                .then(() => refreshRemotes())
                .then(Dialogs.close, ex => setError(ex.message));
    };

    const handleChange = (event, isChecked) => {
        if (isChecked) {
            setSelectedRemotes([...selectedRemotes, event.target.id]);
        } else {
            setSelectedRemotes(selectedRemotes.filter(remote => remote !== event.target.id));
        }
    };

    const actions = [
        <Button key="remove-repo"
            variant="danger"
            isDisabled={selectedRemotes.length === 0}
            onClick={() => onDelete()}>
            {_("Remove")}
        </Button>,
        <Button key="cancel" variant="link" onClick={Dialogs.close}>
            {_("Cancel")}
        </Button>
    ];

    const repositories = availableRemotes.map(remote => {
        return (
            <Checkbox label={remote}
                key={remote}
                id={remote}
                onChange={handleChange}
                isChecked={selectedRemotes.includes(remote)}
                isDisabled={origin.remote === remote} />
        );
    });

    return (
        <Modal isOpen
            id="remove-repository-modal"
            title={_("Remove repository")}
            position="top"
            variant="small"
            onClose={Dialogs.close}
            actions={actions}
        >
            <Form isHorizontal>
                {error && <Alert variant="danger" isInline title={error} />}
                <FormGroup isStack
                    label={_("Repository")}
                    role="group"
                    hasNoPaddingTop
                >
                    {repositories}
                </FormGroup>
            </Form>
        </Modal>
    );
};

RemoveRepositoryModal.propTypes = {
    origin: PropTypes.object.isRequired,
    availableRemotes: PropTypes.array.isRequired,
    refreshRemotes: PropTypes.func.isRequired,
};

export const AddRepositoryModal = ({ refreshRemotes }) => {
    const Dialogs = useDialogs();
    const [newRepoName, setNewRepoName] = useState("");
    const [newRepoURL, setNewRepoURL] = useState("");
    const [newRepoTrusted, setNewRepoTrusted] = useState(false);

    const [hasValidation, setHasValidation] = useState(false);
    const [addNewRepoError, setAddNewRepoError] = useState(undefined);

    const onAddRemote = () => {
        if (!(newRepoURL.trim().length && newRepoName.trim().length)) {
            setHasValidation(true);
            return;
        }
        return remotes.addRemote(newRepoName, newRepoURL, newRepoTrusted)
                .then(() => refreshRemotes())
                .then(Dialogs.close,
                      ex => setAddNewRepoError(ex.message));
    };

    const actions = [
        <Button key="add-repo"
            variant="primary"
            onClick={() => onAddRemote()}>
            {_("Add repository")}
        </Button>,
        <Button key="cancel" variant="link" onClick={Dialogs.close}>
            {_("Cancel")}
        </Button>
    ];

    return (
        <Modal isOpen
            id="add-repository-modal"
            title={_("Add new repository")}
            position="top"
            variant="small"
            onClose={Dialogs.close}
            actions={actions}
        >
            <Form isHorizontal>
                {addNewRepoError && <Alert variant="danger" isInline title={addNewRepoError} />}
                <FormGroup label={_("Name")}
                    fieldId="new-remote-name"
                    isRequired
                >
                    <TextInput id="new-remote-name"
                        value={newRepoName}
                        isRequired
                        type="text"
                        onChange={(_ev, name) => setNewRepoName(name)}
                    />
                    <FormHelper fieldId="new-remote-name"
                        helperTextInvalid={(hasValidation && !newRepoName.trim().length) && _("Please provide a valid name")}
                    />
                </FormGroup>
                <FormGroup label={_("URL")}
                    fieldId="new-remote-url"
                    isRequired
                >
                    <TextInput id="new-remote-url"
                        value={newRepoURL}
                        isRequired
                        type="text"
                        onChange={(_ev, url) => setNewRepoURL(url)}
                    />
                    <FormHelper fieldId="new-remote-url"
                        helperTextInvalid={(hasValidation && !newRepoURL.trim().length) && _("Please provide a valid URL")}
                    />
                </FormGroup>
                <FormGroup label={_("Security")}
                    fieldId="new-gpg-verify"
                    role="group"
                    hasNoPaddingTop
                >
                    <Checkbox label={_("Use trusted GPG key")}
                        id="new-gpg-verify"
                        isChecked={newRepoTrusted}
                        onChange={(_ev, checked) => setNewRepoTrusted(checked)}
                    />
                </FormGroup>
            </Form>
        </Modal>
    );
};

AddRepositoryModal.propTypes = {
    refreshRemotes: PropTypes.func.isRequired,
};

export const EditRepositoryModal = ({ remote, availableRemotes }) => {
    const Dialogs = useDialogs();
    const [addAnotherKey, setAddAnotherKey] = useState(false);
    const [key, setKey] = useState('');
    const [error, setError] = useState('');
    const [isSelectRemoteExpanded, setSelectRemoteExpanded] = useState(false);
    const [selectedRemote, setSelectedRemote] = useState(remote);
    const [newURL, setNewURL] = useState('');
    const [isTrusted, setIsTrusted] = useState(null);

    useEffect(() => {
        remotes.loadRemoteSettings(selectedRemote)
                .then(remoteSettings => {
                    setNewURL(remoteSettings.url);
                    setIsTrusted(remoteSettings['gpg-verify'] === "true");
                });
    }, [selectedRemote]);

    if (!newURL)
        return;

    const onUpdate = () => {
        const promises = [];
        if (key)
            promises.push(remotes.importGPGKey(selectedRemote, key));

        const options = {
            url: newURL,
            "gpg-verify": isTrusted,
        };

        promises.push(remotes.updateRemoteSettings(selectedRemote, options));

        Promise.all(promises).then(() => Dialogs.close(), ex => setError(ex.message));
    };

    const actions = [
        <Button key="edit-repo" variant="primary" onClick={onUpdate}>
            {_("Save")}
        </Button>,
        <Button key="cancel" variant="link" onClick={Dialogs.close}>
            {_("Cancel")}
        </Button>,
    ];

    return (
        <Modal title={_("Edit repository")}
            position="top"
            variant="small"
            id="edit-repository-modal"
            isOpen
            onClose={Dialogs.close}
            actions={actions}
        >
            <Form isHorizontal>
                {error && <Alert variant="danger" isInline title={error} />}
                <FormGroup label={_("Repository")}
                    id="select-repository"
                    fieldId="select-repository"
                >
                    <Select isOpen={isSelectRemoteExpanded}
                        selections={selectedRemote}
                        onToggle={(_, expanded) => setSelectRemoteExpanded(expanded) }
                        onSelect={(_, remote) => { setSelectRemoteExpanded(false); setSelectedRemote(remote) }}
                        menuAppendTo="parent"
                    >
                        {availableRemotes.map(remote => <SelectOption id={remote} value={remote} key={remote}> {remote} </SelectOption>)}
                    </Select>
                </FormGroup>
                <FormGroup label={_("URL")}
                    fieldId="edit-remote-url"
                >
                    <TextInput id="edit-remote-url"
                        value={newURL}
                        onChange={(_ev, url) => setNewURL(url)}
                        type="text" />
                </FormGroup>
                <FormGroup fieldId="edit-remote-trusted">
                    <Checkbox label={_("Use trusted GPG key")}
                        id="gpg-verify"
                        isChecked={isTrusted}
                        onChange={(_ev, checked) => {
                            setIsTrusted(checked);
                        }} />
                </FormGroup>
                <FormGroup fieldId="add-another-key">
                    {!addAnotherKey
                        ? <Button isInline variant="secondary" id='add-another-key' onClick={() => setAddAnotherKey(true)}>{_("Add another key")}</Button>
                        : <TextArea id='gpg-data'
                                placeholder={ cockpit.format(_("Begins with $0"), "'-----BEGIN GPG PUBLIC KEY BLOCK-----'") }
                                onChange={(_ev, key) => setKey(key)}
                                value={key}
                                aria-label={_("GPG public key")} />}
                </FormGroup>
            </Form>
        </Modal>
    );
};

EditRepositoryModal.propTypes = {
    remote: PropTypes.string.isRequired,
    availableRemotes: PropTypes.array.isRequired,
};

export const RebaseRepositoryModal = ({ origin, availableRemotes, currentOriginBranches, currentBranchLoadError, onChangeBranch, onChangeRemoteOrigin }) => {
    const Dialogs = useDialogs();
    const [isSelectRemoteExpanded, setSelectRemoteExpanded] = useState(false);
    const [selectedRemote, setSelectedRemote] = useState(origin.remote);
    const [isSelectBranchExpanded, setSelectBranchExpanded] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState(origin.branch);
    const [availableBranches, setAvailableBranches] = useState(currentOriginBranches);
    const [branchLoadError, setBranchLoadError] = useState(currentBranchLoadError);
    const [loadingBranches, setLoadingBranches] = useState(false);
    const [error, setError] = useState(null);

    const handeRemoteSelect = async (remote) => {
        setSelectedRemote(remote);
        setLoadingBranches(true);
        remotes.listBranches(remote)
                .then(newBranches => {
                    setBranchLoadError(null);
                    setAvailableBranches(newBranches);
                    setLoadingBranches(false);

                    if (newBranches.includes(origin.branch)) {
                        setSelectedBranch(origin.branch);
                    } else {
                        setSelectedBranch(newBranches[0]);
                    }
                })
                .catch(ex => {
                    setBranchLoadError(ex.message);
                    setAvailableBranches(null);
                    setLoadingBranches(false);
                });
    };

    const onRebaseClicked = () => {
        onChangeRemoteOrigin(selectedRemote)
                .then(() => onChangeBranch(selectedBranch))
                .then(Dialogs.close())
                .catch(ex => setError(ex.message));
    };

    const actions = [
        <Button key="rebase"
            variant="primary"
            onClick={onRebaseClicked}
        >
            {_("Rebase")}
        </Button>,
        <Button key="cancel"
            variant="link"
            onClick={Dialogs.close}
        >
            {_("Cancel")}
        </Button>
    ];

    const repositoryComponent = availableRemotes.length > 1
        ? (
            <Select isOpen={isSelectRemoteExpanded}
                selections={selectedRemote}
                onToggle={(_, expanded) => setSelectRemoteExpanded(expanded) }
                onSelect={(_, remote) => { setSelectRemoteExpanded(false); handeRemoteSelect(remote) }}
                menuAppendTo="parent"
            >
                {availableRemotes.map(remote => <SelectOption id={remote} value={remote} key={remote}> {remote} </SelectOption>)}
            </Select>
        )
        : (
            <Text>{availableRemotes[0]}</Text>
        );

    const branchComponent = branchLoadError
        ? (
            <Flex spacer={{ default: 'spaceItemsSm' }} flexWrap={{ default: 'nowrap' }} className="pf-v5-u-danger-color-200">
                <FlexItem><ExclamationCircleIcon /></FlexItem>
                <FlexItem>{branchLoadError.replace("error: ", "")}</FlexItem>
            </Flex>
        )
        : (
            availableBranches.length > 1
                ? (
                    <Select isOpen={isSelectBranchExpanded}
                        selections={selectedBranch}
                        onToggle={(_, expanded) => setSelectBranchExpanded(expanded) }
                        onSelect={(_, branch) => { setSelectBranchExpanded(false); setSelectedBranch(branch) }}
                        menuAppendTo="parent"
                    >
                        {availableBranches.map(branch => <SelectOption value={branch} key={branch}> {branch} </SelectOption>)}
                    </Select>
                )
                : (
                    <Text>{availableBranches[0]}</Text>
                )
        );

    const loadingComponent = (
        <Flex spacer={{ default: 'spaceItemsSm' }} flexWrap={{ default: 'nowrap' }}>
            <FlexItem><Spinner size="md" /></FlexItem>
            <FlexItem>{_("Loading branches")}</FlexItem>
        </Flex>
    );

    return (
        <Modal title={_("Rebase repository and branch")}
            position="top"
            variant="small"
            id="rebase-repository-modal"
            isOpen
            onClose={Dialogs.close}
            actions={actions}
        >
            {error && <Alert variant="danger" isInline title={error} />}
            <Form isHorizontal>
                <FormGroup label={_("Repository")}
                    id="change-repository"
                    fieldId="selected-repository"
                    hasNoPaddingTop={availableRemotes.length === 1}
                >
                    {repositoryComponent}
                </FormGroup>
                <FormGroup label={_("Branch")}
                    id="change-branch"
                    fieldId="selected-branch"
                    hasNoPaddingTop={loadingBranches || branchLoadError || availableBranches.length === 1}
                >
                    {loadingBranches
                        ? loadingComponent
                        : branchComponent
                    }
                </FormGroup>
            </Form>
        </Modal>
    );
};

RebaseRepositoryModal.propTypes = {
    origin: PropTypes.object.isRequired,
    availableRemotes: PropTypes.array.isRequired,
    currentOriginBranches: PropTypes.array,
    currentBranchLoadError: PropTypes.string,
    onChangeBranch: PropTypes.func.isRequired,
    onChangeRemoteOrigin: PropTypes.func.isRequired,
};
