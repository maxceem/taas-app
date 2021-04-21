/**
 * InterviewDetailsPopup
 *
 * Popup that allows user to schedule an interview
 * Calls addInterview action
 */
import React, { useEffect, useState, useCallback } from "react";
import { getAuthUserProfile } from "@topcoder/micro-frontends-navbar-app";
import { Form } from "react-final-form";
import arrayMutators from "final-form-arrays";
import { FieldArray } from "react-final-form-arrays";
import { useDispatch } from "react-redux";
import { addInterview } from "../../actions";
import User from "components/User";
import BaseModal from "components/BaseModal";
import FormField from "components/FormField";
import Button from "components/Button";
import { FORM_FIELD_TYPE } from "constants";
import "./styles.module.scss";
import RadioFieldGroup from "components/RadioFieldGroup";

/* Validators for Form */

const validateExists = (value) => {
  return value ? undefined : "Required";
};

const validateIsEmail = (value) => {
  if (!value) return undefined;
  return /\S+@\S+\.\S+/.test(value) ? undefined : "Please enter valid email";
};

const validator = (values) => {
  const errors = {};

  errors.myemail =
    validateExists(values.myemail) || validateIsEmail(values.myemail);
  errors.email2 =
    validateExists(values.email2) || validateIsEmail(values.email2);

  errors.emails = [];
  if (values.emails) {
    for (const email of values.emails) {
      errors.emails.push(validateIsEmail(email));
    }
  }

  return errors;
};

/********************* */

function InterviewDetailsPopup({ open, onClose, candidate, openNext }) {
  const [isLoading, setIsLoading] = useState(true);
  const [myEmail, setMyEmail] = useState("");
  const [myId, setMyId] = useState("");
  const dispatch = useDispatch();

  useEffect(() => {
    getAuthUserProfile().then((res) => {
      setMyEmail(res.email || "");
      setMyId(res.userId);
      setIsLoading(false);
    });
  }, []);

  const onSubmitCallback = useCallback(
    async (formData) => {
      const secondaryEmails =
        formData.emails?.filter(
          (email) => typeof email === "string" && email.length > 0
        ) || [];
      const interviewData = {
        xaiTemplate: formData.time,
        attendeesList: [formData.myemail, formData.email2, ...secondaryEmails],
        round: candidate.interviews.length + 1,
        createdBy: myId,
      };

      await dispatch(addInterview(candidate.id, interviewData));
    },
    [dispatch, candidate, myId]
  );

  return isLoading ? null : (
    <Form
      initialValues={{
        myemail: myEmail,
        time: "30-min-interview",
      }}
      onSubmit={onSubmitCallback}
      mutators={{
        ...arrayMutators,
      }}
      validate={validator}
    >
      {({
        handleSubmit,
        form: {
          mutators: { push },
          reset,
        },
        submitting,
        hasValidationErrors,
      }) => (
        <BaseModal
          open={open}
          onClose={() => {
            reset();
            onClose();
          }}
          title="Schedule an Interview"
          button={
            <Button
              onClick={() => {
                handleSubmit().then(() => {
                  reset();
                  onClose();
                  openNext();
                });
              }}
              size="medium"
              isSubmit
              disabled={submitting || hasValidationErrors}
            >
              Begin scheduling
            </Button>
          }
          disabled={submitting}
        >
          <div>
            <div styleName="top">
              <div styleName="user">
                {candidate === null ? (
                  ""
                ) : (
                  <User
                    user={{
                      ...candidate,
                      photoUrl: candidate.photo_url,
                    }}
                    hideFullName
                  />
                )}
              </div>
              <RadioFieldGroup
                name="time"
                isHorizontal
                radios={[
                  {
                    label: "30 Minute Interview",
                    value: "30-min-interview",
                  },
                  {
                    label: "60 Minute Interview",
                    value: "60-min-interview",
                  },
                ]}
              />
            </div>
            <div styleName="center">
              <h4 styleName="center-header">Attendees:</h4>
              <p styleName="modal-text">
                Please provide email addresses for all parties you would like
                involved with the interview.
              </p>
              <FormField
                field={{
                  name: "myemail",
                  type: FORM_FIELD_TYPE.TEXT,
                  placeholder: "Email Address",
                  label: "Email Address",
                  maxLength: 320,
                  customValidator: true,
                }}
              />
              <FormField
                field={{
                  name: "email2",
                  type: FORM_FIELD_TYPE.TEXT,
                  placeholder: "Email Address",
                  label: "Email Address",
                  maxLength: 320,
                  customValidator: true,
                }}
              />
              <button
                styleName="add-more modal-text"
                onClick={() => push("emails")}
              >
                Add more
              </button>
              <FieldArray name="emails">
                {({ fields }) => {
                  return fields.map((name, index) => (
                    <div styleName="array-item">
                      <div styleName="array-input">
                        <FormField
                          key={name}
                          field={{
                            name,
                            type: FORM_FIELD_TYPE.TEXT,
                            placeholder: "Email Address",
                            label: "Email Address",
                            maxLength: 320,
                            customValidator: true,
                          }}
                        />
                      </div>
                      <span
                        tabIndex={0}
                        role="button"
                        onClick={() => fields.remove(index)}
                        styleName="remove-item"
                      >
                        &times;
                      </span>
                    </div>
                  ));
                }}
              </FieldArray>
            </div>
            <div styleName="bottom">
              <p styleName="modal-text">
                Selecting “Begin Scheduling” will initiate emails to all
                attendees to coordinate availabiltiy. Please check your email to
                input your availability.
              </p>
            </div>
          </div>
        </BaseModal>
      )}
    </Form>
  );
}

export default InterviewDetailsPopup;