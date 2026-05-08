import { useAuth } from "@processes/auth"

import "./dashboardUsersNormal.css"

export function UserDashboardPage() {
  const { session } = useAuth()
  const fullName = session && session.user.kind === "user" ? session.user.fullName : "Alex"
  const firstName = fullName.trim().split(" ")[0] || "Alex"

  return (
    <div className="v64_832">
      <div className="v64_833">
        <div className="v64_834">
          <div className="v64_835">
            <div className="v64_836">
              <span className="v64_837">{`Welcome back, ${firstName}.`}</span>
            </div>
            <div className="v64_838">
              <span className="v64_839">
                You have 12 new applications for your active roles today.
              </span>
            </div>
          </div>
          <div className="v64_840">
            <div className="v64_841" />
            <div className="v64_842">
              <div className="v64_843" />
            </div>
            <span className="v64_844">Post a New Job</span>
          </div>
        </div>
        <div className="v64_845">
          <div className="v64_846">
            <div className="v64_847">
              <span className="v64_848">ACTIVE JOBS</span>
            </div>
            <div className="v64_849">
              <div className="v64_850">
                <span className="v64_851">08</span>
              </div>
              <div className="v64_852">
                <span className="v64_853">+2 this month</span>
              </div>
            </div>
          </div>
          <div className="v64_854">
            <div className="v64_855">
              <span className="v64_856">TOTAL APPLICATIONS</span>
            </div>
            <div className="v64_857">
              <div className="v64_858">
                <span className="v64_859">342</span>
              </div>
              <div className="v64_860">
                <div className="v64_861" />
              </div>
            </div>
          </div>
          <div className="v64_862">
            <div className="v64_863">
              <span className="v64_864">PENDING INTERVIEWS</span>
            </div>
            <div className="v64_865">
              <div className="v64_866">
                <span className="v64_867">14</span>
              </div>
              <div className="v64_868">
                <div className="v64_869" />
                <div className="v64_870">
                  <div className="v64_871" />
                </div>
                <div className="v64_872">
                  <div className="v64_873" />
                </div>
              </div>
            </div>
          </div>
          <div className="v64_874">
            <div className="v64_875">
              <span className="v64_876">AI MATCH RATE AVG.</span>
            </div>
            <div className="v64_877">
              <div className="v64_878">
                <span className="v64_879">92%</span>
              </div>
              <div className="v64_880">
                <div className="v64_881" />
              </div>
            </div>
          </div>
        </div>
        <div className="v64_882">
          <div className="v64_883">
            <div className="v64_884">
              <div className="v64_885">
                <div className="v64_886">
                  <span className="v64_887">Top Talent Recommendations</span>
                </div>
                <div className="v64_888">
                  <span className="v64_889">View All Matches</span>
                </div>
              </div>
              <div className="v64_890">
                <div className="v64_891">
                  <div className="v64_892" />
                  <div className="v64_893">
                    <div className="v64_894" />
                    <div className="v64_895">
                      <div className="v64_896">
                        <span className="v64_897">Sarah Jenkins</span>
                      </div>
                      <div className="v64_898">
                        <span className="v64_899">Senior Product Designer</span>
                      </div>
                      <div className="v64_900">
                        <div className="v64_901">
                          <span className="v64_902">98% MATCH</span>
                        </div>
                        <div className="v64_903">
                          <span className="v64_904">FIGMA EXPERT</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="v64_905">
                    <span className="v64_906">
                      8+ years of experience at top-tier SaaS companies. Expert in
                      design systems and user-centric…
                    </span>
                  </div>
                  <div className="v64_907">
                    <div className="v64_908">
                      <span className="v64_909">Invite to Apply</span>
                    </div>
                    <div className="v64_910">
                      <div className="v64_911">
                        <div className="v64_912" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="v64_913">
                  <div className="v64_914" />
                  <div className="v64_915">
                    <div className="v64_916" />
                    <div className="v64_917">
                      <div className="v64_918">
                        <span className="v64_919">Marcus Thorne</span>
                      </div>
                      <div className="v64_920">
                        <span className="v64_921">Lead Backend Engineer</span>
                      </div>
                      <div className="v64_922">
                        <div className="v64_923">
                          <span className="v64_924">95% MATCH</span>
                        </div>
                        <div className="v64_925">
                          <span className="v64_926">NODE.JS</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="v64_927">
                    <span className="v64_928">
                      Specializes in high-scale infrastructure and microservices.
                      Previously led engineering at…
                    </span>
                  </div>
                  <div className="v64_929">
                    <div className="v64_930">
                      <span className="v64_931">Invite to Apply</span>
                    </div>
                    <div className="v64_932">
                      <div className="v64_933">
                        <div className="v64_934" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="v64_935">
              <div className="v64_936">
                <div className="v64_937">
                  <span className="v64_938">Active Job Postings</span>
                </div>
                <div className="v64_939">
                  <div className="v64_940" />
                </div>
              </div>
              <div className="v64_941">
                <div className="v64_942">
                  <div className="v64_943">
                    <div className="v64_944">
                      <span className="v64_945">ROLE NAME</span>
                    </div>
                    <div className="v64_946">
                      <span className="v64_947">STATUS</span>
                    </div>
                    <div className="v64_948">
                      <span className="v64_949">APPLICANTS</span>
                    </div>
                    <div className="v64_950">
                      <span className="v64_951">ACTION</span>
                    </div>
                  </div>
                  <div className="v64_952">
                    <div className="v64_953">
                      <div className="v64_954">
                        <div className="v64_955">
                          <span className="v64_956">Senior UX Designer</span>
                        </div>
                        <div className="v64_957">
                          <span className="v64_958">Posted 3 days ago</span>
                        </div>
                      </div>
                      <div className="v64_959">
                        <div className="v64_960" />
                        <span className="v64_961">Active</span>
                      </div>
                      <div className="v64_962">
                        <span className="v64_963">48</span>
                        <span className="v64_964">applicants</span>
                      </div>
                      <div className="v64_965">
                        <div className="v64_966">
                          <span className="v64_967">Manage</span>
                        </div>
                      </div>
                    </div>
                    <div className="v64_968">
                      <div className="v64_969">
                        <div className="v64_970">
                          <span className="v64_971">Marketing Director</span>
                        </div>
                        <div className="v64_972">
                          <span className="v64_973">Posted 1 week ago</span>
                        </div>
                      </div>
                      <div className="v64_974">
                        <div className="v64_975" />
                        <span className="v64_976">Active</span>
                      </div>
                      <div className="v64_977">
                        <span className="v64_978">112</span>
                        <span className="v64_979">applicants</span>
                      </div>
                      <div className="v64_980">
                        <div className="v64_981">
                          <span className="v64_982">Manage</span>
                        </div>
                      </div>
                    </div>
                    <div className="v64_983">
                      <div className="v64_984">
                        <div className="v64_985">
                          <span className="v64_986">Lead DevOps Engineer</span>
                        </div>
                        <div className="v64_987">
                          <span className="v64_988">Draft</span>
                        </div>
                      </div>
                      <div className="v64_989">
                        <div className="v64_990" />
                        <span className="v64_991">Paused</span>
                      </div>
                      <div className="v64_992">
                        <span className="v64_993">0</span>
                        <span className="v64_994">applicants</span>
                      </div>
                      <div className="v64_995">
                        <div className="v64_996">
                          <span className="v64_997">Resume</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="v64_998">
          <div className="v64_999">
            <div className="v64_1000">
              <span className="v64_1001">Recent Activity</span>
            </div>
            <div className="v64_1002">
              <div className="v64_1003">
                <div className="v64_1004">
                  <div className="v64_1005">
                    <div className="v64_1006" />
                  </div>
                </div>
                <div className="v64_1007">
                  <div className="v64_1008">
                    <span className="v64_1009">
                      New application for Junior UX Designer
                    </span>
                  </div>
                  <div className="v64_1010">
                    <span className="v64_1011">2 minutes ago</span>
                  </div>
                </div>
              </div>
              <div className="v64_1012">
                <div className="v64_1013">
                  <div className="v64_1014">
                    <div className="v64_1015" />
                  </div>
                </div>
                <div className="v64_1016">
                  <div className="v64_1017">
                    <span className="v64_1018">
                      Interview scheduled with David Chen
                    </span>
                  </div>
                  <div className="v64_1019">
                    <span className="v64_1020">1 hour ago</span>
                  </div>
                </div>
              </div>
              <div className="v64_1021">
                <div className="v64_1022">
                  <div className="v64_1023">
                    <div className="v64_1024" />
                  </div>
                </div>
                <div className="v64_1025">
                  <div className="v64_1026">
                    <span className="v64_1027">
                      New high-match talent identified by AI
                    </span>
                  </div>
                  <div className="v64_1028">
                    <span className="v64_1029">3 hours ago</span>
                  </div>
                </div>
              </div>
              <div className="v64_1030">
                <div className="v64_1031">
                  <div className="v64_1032">
                    <div className="v64_1033" />
                  </div>
                </div>
                <div className="v64_1034">
                  <div className="v64_1035">
                    <span className="v64_1036">Message received from Elena Rodriguez</span>
                  </div>
                  <div className="v64_1037">
                    <span className="v64_1038">Yesterday</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="v64_1039">
              <div className="v64_1040">
                <span className="v64_1041">Pro Tip</span>
              </div>
              <div className="v64_1042">
                <span className="v64_1043">
                  Companies that respond within 24 hours to high-match candidates are
                  4x more likely to secure the hire.
                </span>
              </div>
              <div className="v64_1044">
                <span className="v64_1045">Learn More</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="v64_1046">
        <div className="v64_1047">
          <div className="v64_1048">
            <span className="v64_1049">FirsTep</span>
            <span className="v64_1050">
              © 2024 FirsTep Technologies. All rights reserved.
            </span>
          </div>
          <div className="v64_1051">
            <div className="v64_1052">
              <span className="v64_1053">Privacy Policy</span>
            </div>
            <div className="v64_1054">
              <span className="v64_1055">Terms of Service</span>
            </div>
            <div className="v64_1056">
              <span className="v64_1057">Cookie Settings</span>
            </div>
            <div className="v64_1058">
              <span className="v64_1059">Contact Support</span>
            </div>
            <div className="v64_1060">
              <span className="v64_1061">About Us</span>
            </div>
          </div>
        </div>
      </div>
      <div className="v64_1062">
        <div className="v64_1063" />
        <div className="v64_1064">
          <div className="v64_1065">
            <span className="v64_1066">FirsTep</span>
          </div>
          <div className="v64_1067">
            <div className="v64_1068">
              <span className="v64_1069">Dashboard</span>
            </div>
            <div className="v64_1070">
              <span className="v64_1071">Talent Pool</span>
            </div>
            <div className="v64_1072">
              <span className="v64_1073">Job Postings</span>
            </div>
            <div className="v64_1074">
              <span className="v64_1075">Analytics</span>
            </div>
          </div>
        </div>
        <div className="v64_1076">
          <div className="v64_1077">
            <div className="v64_1078">
              <div className="v64_1079">
                <span className="v64_1080">Search talent...</span>
              </div>
            </div>
            <div className="v64_1081">
              <div className="v64_1082" />
            </div>
          </div>
          <div className="v64_1083">
            <div className="v64_1084" />
          </div>
          <div className="v64_1085">
            <div className="v64_1086" />
          </div>
          <div className="v64_1087" />
        </div>
      </div>
    </div>
  )
}
