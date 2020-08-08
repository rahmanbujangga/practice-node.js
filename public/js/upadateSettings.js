import axios from 'axios';

import { showAlert } from './alert';
export const updateData = async (type, data) => {
  try {
    const url =
      type === 'password'
        ? 'http://127.0.0.1:3000/api/v1/users/update-mypassword'
        : 'http://127.0.0.1:3000/api/v1/users/update-me';

    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });

    if (res.data.status === 'success') {
      showAlert(
        'success',
        `${type.toUpperCase()} has been updated succesfully !`
      );
      window.setTimeout(() => {
        location.assign('/me');
      }, 1500);
    }
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};
