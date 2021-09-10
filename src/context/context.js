import React, { useState, useEffect } from "react";
import mockUser from "./mockData.js/mockUser";
import mockRepos from "./mockData.js/mockRepos";
import mockFollowers from "./mockData.js/mockFollowers";
import axios from "axios";

const rootUrl = "https://api.github.com";

const GithubContext = React.createContext();

const GithubProvider = ({ children }) => {
  const [githubUser, setGithubUser] = useState(mockUser);
  const [repos, setRepos] = useState(mockRepos);
  const [followers, setFollowers] = useState(mockFollowers);

  // request
  const [requests, setRequests] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // error
  const [error, setError] = useState({ show: false, msg: "" });

  // check requests rate limit
  const checkRequests = () => {
    axios(`${rootUrl}/rate_limit`)
      .then(({ data }) => {
        let {
          rate: { remaining },
        } = data;

        setRequests(remaining);
        if (remaining === 0) {
          // thow error
          toggleError(true, "Sorry! You have exceeded your hourly rate limit.");
        }
      })
      .catch((error) => console.log(error));
  };

  // error toggler
  const toggleError = (show = false, msg = "") => {
    setError({ show, msg });
  };

  // fetch  github user
  const getGithubUser = async (user) => {
    toggleError(); // reset error message
    setIsLoading(true);

    const response = await axios(`${rootUrl}/users/${user}`).catch((error) =>
      console.log(error)
    );
    if (response) {
      setGithubUser(response.data);
      const { login, followers_url } = response.data;
      // get repos
      axios(`${rootUrl}/users/${login}/repos?per_page=100`).then((res) =>setRepos(res.data)
      );
      // get followers
      axios(`${followers_url}?per_page=100`).then((res) => setFollowers(res.data));

      await Promise.allSettled([
        axios(`${rootUrl}/users/${login}/repos?per_page=100`),
        axios(`${followers_url}?per_page=100`),
      ]).then(result => {
          const [repos, followers] = result;
          const status = 'fulfilled';

          if(repos.status === status){
              setRepos(repos.value.data);
          }
          if(followers.status === status){
              setFollowers(followers.value.data);
          }
      }).catch(error => console.log(error));

    } else {
      toggleError(true, "there is no user.");
    }
    checkRequests();
    setIsLoading(false);
  };

  useEffect(checkRequests, []);

  return (
    <GithubContext.Provider
      value={{
        githubUser,
        repos,
        followers,
        requests,
        error,
        isLoading,
        getGithubUser,
      }}
    >
      {children}
    </GithubContext.Provider>
  );
};

export { GithubContext, GithubProvider };
