package com.creno.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.creno.appointment.AppointmentEvent;
import com.creno.appointment.AppointmentRepository;
import com.creno.config.BusinessProperties;

/**
 * Envoie les emails de rendez-vous.
 * <ul>
 *   <li>{@code AFTER_COMMIT} : l'email ne part que si la réservation est réellement enregistrée ;</li>
 *   <li>{@code @Async} : un SMTP lent ou en panne ne ralentit ni ne fait échouer la réservation ;</li>
 *   <li>sans SMTP configuré (dev, tests), l'email est simplement écrit dans les logs.</li>
 * </ul>
 */
@Component
public class AppointmentNotifier {

    private static final Logger log = LoggerFactory.getLogger(AppointmentNotifier.class);

    private final AppointmentRepository appointments;
    private final ObjectProvider<JavaMailSender> mailSender;
    private final MailProperties mail;
    private final AppointmentEmails emails;

    public AppointmentNotifier(AppointmentRepository appointments, ObjectProvider<JavaMailSender> mailSender,
                               MailProperties mail, BusinessProperties business) {
        this.appointments = appointments;
        this.mailSender = mailSender;
        this.mail = mail;
        this.emails = new AppointmentEmails(mail, business.zoneId(), business.cancellationNotice());
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void on(AppointmentEvent event) {
        appointments.findWithDetails(event.appointmentId())
                .map(a -> emails.build(event.type(), a))
                .ifPresent(this::send);
    }

    private void send(AppointmentEmails.Email email) {
        JavaMailSender sender = mailSender.getIfAvailable();
        if (sender == null) {
            log.info("Email non envoyé (SMTP non configuré) → {} : {}\n{}", email.to(), email.subject(), email.body());
            return;
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mail.from());
        message.setTo(email.to());
        message.setSubject(email.subject());
        message.setText(email.body());
        try {
            sender.send(message);
            log.info("Email envoyé à {} : {}", email.to(), email.subject());
        } catch (MailException e) {
            // Le RDV est enregistré quoi qu'il arrive : on trace l'échec sans le propager.
            log.warn("Échec d'envoi de l'email à {} : {}", email.to(), e.getMessage());
        }
    }
}
