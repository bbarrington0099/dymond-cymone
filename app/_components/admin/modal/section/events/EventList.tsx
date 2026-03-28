'use client';

import React from "react";
import { RemoveEventForm, List, ListItem, Button } from "@components/admin";
import { ArtistEventPayload } from "@actions/artist";

import styles from './AdminModalSectionEvents.module.scss';

interface EventListProps {
	initialEvents: ArtistEventPayload[];
	setSelectedId: React.Dispatch<React.SetStateAction<string | null>>;
}
export const EventList = (props: EventListProps) => {
    const { initialEvents, setSelectedId } = props;

    return (
        <List>
            {initialEvents.map((e) => (
                <ListItem key={e.id}>
                    <div className={styles.eventMain}>
                        <strong>{e.title}</strong>
                        <div className={styles.eventMeta}>
                            {e.eventDate
                                ? new Date(
                                        e.eventDate,
                                    ).toLocaleDateString()
                                : ''}
                            {e.eventTime ? ` ${e.eventTime}` : ''}
                            {e.venue ? ` @ ${e.venue}` : ''}
                            {e.locationText
                                ? `, ${e.locationText}`
                                : ''}
                        </div>
                    </div>

                    <div className={styles.eventActions}>
                        <Button
                            type='button'
                            className={styles.secondaryBtn}
                            onClick={() => setSelectedId(e.id)}
                            content='Edit'
                        />
                        <RemoveEventForm 
                            eventId={e.id} 
                        />
                    </div>
                </ListItem>
            ))}
        </List>
    )
}
