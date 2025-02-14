import { FC, FormEvent } from "react";
import styles from "./loginPage.module.scss";
import { useLoginUserMutation } from "../../api/userService";
import { useAppDispatch } from "../../store/hooks";
import { auth, authState, id, orgId, role } from "../../store/redux/user/slice";
import { UserT } from "../../types/common";
import toast from "react-hot-toast";
import { Loader } from "../../components/Loader";
import logo from "./assets/photo (1).png";

export const LoginPage: FC = () => {
  const [authUser, { isLoading: logingIn }] = useLoginUserMutation();
  const dispatch = useAppDispatch();

  const handleSubmitForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formdata = new FormData(event.currentTarget);
    const data = {
      login: formdata.get("username")?.toString(),
      password: formdata.get("password")?.toString(),
    };

    if (data.login && data.password) {
      authUser({ login: data.login, password: data.password })
        .unwrap()
        .then((data) => {
          const state: UserT = {
            authState: {
              access: data.accessToken,
              refresh: data.refreshToken,
            },
            userId: data.userId,
            role: data.role,
            orgId: data.companyId,
            auth: true,
          };
          if (state) {
            dispatch(
              authState({
                access: data.accessToken,
                refresh: data.refreshToken,
              })
            );
            dispatch(role(data.role));
            dispatch(orgId(data.companyId));
            dispatch(id(data.userId));
            dispatch(auth(true));
            toast.success(data.optionalAlertMessage);
          }
        })
        .catch((err) => toast.error(err.data.optionalAlertMessage));
    } else {
      console.log(data);
    }
  };

  return (
    <div className={styles.wrapper}>
      {logingIn && <Loader />}
      <div className={styles.leftBlock}></div>
      <div className={styles.rightBlock}>
        <form className={styles.form} onSubmit={handleSubmitForm}>
          <img src={logo} alt="logo" />
          <h2>Вход на платформу</h2>
          <div className={styles.form_field}>
            <label htmlFor="username" className={styles.form_field_label}>
              Введите имя пользователя
            </label>
            <input
              id="username"
              name="username"
              placeholder="Логин"
              className={styles.form_field_inputField}
            />
          </div>
          <div className={styles.form_field}>
            <label htmlFor="password" className={styles.form_field_label}>
              Введите пароль
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Пароль"
              className={styles.form_field_inputField}
            />
          </div>
          <button type="submit" className={styles.form_submit}>
            Войти
          </button>
        </form>
        <p className={styles.annotation}>
          © ООО "МЕДИСОНТ" типография и издательство
        </p>
      </div>
    </div>
  );
};
